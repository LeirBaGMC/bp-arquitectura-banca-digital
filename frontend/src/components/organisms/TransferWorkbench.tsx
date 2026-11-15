import { useRef, useState, type FormEvent } from 'react';
import { Alert, Autocomplete, Box, Button, Card, CardContent, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import type { Account, BankingData } from '../../types/banking';
import { createTransfer, describeApiError } from '../../services/bankingApi';
import { dateText, money } from '../../utils/format';
import { StatusBadge } from '../atoms/StatusBadge';

type DestinationKind = 'OWN' | 'INTERBANK';
type TransferMessage = { text: string; severity: 'success' | 'error' };

const banks = ['Banco Andino', 'Cooperativa Sol', 'Banco del Centro'];
const recipientNamePattern = /^[\p{L}\p{M}][\p{L}\p{M} .'-]{0,99}$/u;

function accountLabel(account: Account) {
  return `${account.alias} · ${account.number}`;
}

export function TransferWorkbench({ data, refresh, flash }: { data: BankingData; refresh: () => Promise<void>; flash: (message: string) => void }) {
  const [kind, setKind] = useState<DestinationKind>('OWN');
  const [sourceAccountId, setSourceAccountId] = useState(data.accounts[0]?.id ?? '');
  const [destinationAccountId, setDestinationAccountId] = useState(data.accounts.find(account => account.id !== data.accounts[0]?.id)?.id ?? '');
  const [recipientName, setRecipientName] = useState('');
  const [recipientBank, setRecipientBank] = useState<string | null>(null);
  const [destinationAccountNumber, setDestinationAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState<TransferMessage | null>(null);
  const submitting = useRef(false);
  const requestIdentity = useRef<{ fingerprint: string; key: string } | null>(null);
  const destinations = data.accounts.filter(account => account.id !== sourceAccountId);
  const sourceAccount = data.accounts.find(account => account.id === sourceAccountId) ?? null;
  const amountValue = Number(amount.replace(',', '.'));
  const amountIsValid = /^\d+(?:[.,]\d{1,2})?$/.test(amount.trim()) && Number.isFinite(amountValue) && amountValue >= 1 && amountValue <= 2500;
  const nameIsValid = recipientNamePattern.test(recipientName.trim());
  const accountNumberIsValid = /^\d{6,20}$/.test(destinationAccountNumber.trim());
  const descriptionIsValid = description.length <= 120 && !/[\u0000-\u001f\u007f]/.test(description);

  function validate() {
    if (!sourceAccount || (kind === 'OWN' && (!destinations.some(account => account.id === destinationAccountId) || destinationAccountId === sourceAccountId))) {
      setMessage({ text: 'Selecciona una cuenta de origen y un destino válidos.', severity: 'error' });
      return false;
    }
    if (!amountIsValid || amountValue > (sourceAccount?.balance ?? 0)) {
      setMessage({ text: amountIsValid ? 'El monto supera el saldo disponible.' : 'Ingresa un monto entre $1 y $2.500 con máximo dos decimales.', severity: 'error' });
      return false;
    }
    if (kind === 'INTERBANK' && (!nameIsValid || !banks.includes(recipientBank ?? '') || !accountNumberIsValid)) {
      setMessage({ text: 'Revisa el nombre, banco y número de cuenta del beneficiario.', severity: 'error' });
      return false;
    }
    if (!descriptionIsValid) {
      setMessage({ text: 'La descripción debe tener hasta 120 caracteres.', severity: 'error' });
      return false;
    }
    return true;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    setSubmitted(true);
    setMessage(null);
    if (!validate()) return;

    submitting.current = true;
    setBusy(true);
    const payload = {
      sourceAccountId,
      destinationType: kind,
      destinationAccountId: kind === 'OWN' ? destinationAccountId : null,
      recipientName: kind === 'INTERBANK' ? recipientName.trim() : null,
      recipientBank: kind === 'INTERBANK' ? recipientBank : null,
      destinationAccountNumber: kind === 'INTERBANK' ? destinationAccountNumber.trim() : null,
      amount: Number(amount.replace(',', '.')),
      description: description.trim(),
    } as const;
    const fingerprint = JSON.stringify(payload);
    if (requestIdentity.current?.fingerprint !== fingerprint) {
      requestIdentity.current = { fingerprint, key: crypto.randomUUID() };
    }

    try {
      const response = await createTransfer({ ...payload, idempotencyKey: requestIdentity.current.key });
      requestIdentity.current = null;
      const accepted = response.status === 202;
      const statusText = response.data.duplicate ? 'La solicitud ya estaba registrada.' : accepted ? 'Solicitud aceptada y en proceso.' : 'Solicitud registrada.';
      const reference = response.requestId ? ` · Referencia: ${response.requestId}` : '';
      setMessage({ text: `HTTP ${response.status}: ${statusText}${reference}`, severity: 'success' });
      flash(response.data.duplicate ? 'Esta solicitud ya fue recibida.' : 'Solicitud de transferencia recibida.');
      setAmount('');
      setDescription('');
      setSubmitted(false);
      await refresh().catch(() => undefined);
    } catch (error) {
      setMessage({ text: describeApiError(error), severity: 'error' });
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0,1.35fr) minmax(300px,.85fr)' }, gap: 2 }}>
    <Card component="form" onSubmit={submit} aria-busy={busy} noValidate>
      <CardContent sx={{ p: { xs: 2.25, md: 3 } }}>
        <Typography variant="h6" sx={{ fontSize: 18, fontWeight: 700 }}>Nueva transferencia</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>Revisa los datos antes de confirmar.</Typography>
        <Stack spacing={2}>
          <FormControl fullWidth size="small" disabled={busy} required>
            <InputLabel id="source-label">Cuenta de origen</InputLabel>
            <Select labelId="source-label" label="Cuenta de origen" value={sourceAccountId} onChange={event => {
              const nextSource = event.target.value;
              setSourceAccountId(nextSource);
              if (nextSource === destinationAccountId) setDestinationAccountId(data.accounts.find(account => account.id !== nextSource)?.id ?? '');
            }}>
              {data.accounts.map(account => <MenuItem key={account.id} value={account.id}>{account.alias} · {account.number} · {money(account.balance)}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small" disabled={busy}>
            <InputLabel id="kind-label">Tipo de destino</InputLabel>
            <Select labelId="kind-label" label="Tipo de destino" value={kind} onChange={event => { setKind(event.target.value as DestinationKind); setMessage(null); }}>
              <MenuItem value="OWN">Cuenta propia</MenuItem><MenuItem value="INTERBANK">Otro banco</MenuItem>
            </Select>
          </FormControl>
          {kind === 'OWN' ? <Autocomplete<Account>
            options={destinations}
            value={destinations.find(account => account.id === destinationAccountId) ?? null}
            getOptionLabel={accountLabel}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            disabled={busy || destinations.length === 0}
            onChange={(_, account) => setDestinationAccountId(account?.id ?? '')}
            renderInput={params => <TextField {...params} label="Cuenta de destino" required error={submitted && !destinationAccountId} helperText={submitted && !destinationAccountId ? 'Selecciona una cuenta de destino.' : 'Escribe para buscar entre tus cuentas.'} />}
          /> : <>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField label="Nombre del beneficiario" placeholder="Ej. Ana Pérez" value={recipientName} onChange={event => setRecipientName(event.target.value)} disabled={busy} required slotProps={{ htmlInput: { maxLength: 100, autoComplete: 'off' } }} error={submitted && !nameIsValid} helperText={submitted && !nameIsValid ? 'Usa un nombre válido de hasta 100 caracteres.' : ' '}/>
              <Autocomplete options={banks} value={recipientBank} onChange={(_, bank) => setRecipientBank(bank)} disabled={busy} renderInput={params => <TextField {...params} label="Banco" required error={submitted && !recipientBank} helperText={submitted && !recipientBank ? 'Selecciona un banco de la lista.' : 'Escribe para buscar un banco.'} />}/>
            </Box>
            <TextField label="Número de cuenta de destino" placeholder="000123456789" value={destinationAccountNumber} onChange={event => setDestinationAccountNumber(event.target.value.replace(/\D/g, '').slice(0, 20))} disabled={busy} required slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 20, autoComplete: 'off' } }} error={submitted && !accountNumberIsValid} helperText={submitted && !accountNumberIsValid ? 'Ingresa entre 6 y 20 dígitos.' : ' '}/>
          </>}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField label="Monto (USD)" value={amount} onChange={event => setAmount(event.target.value)} disabled={busy} required slotProps={{ htmlInput: { inputMode: 'decimal', maxLength: 12, autoComplete: 'off' } }} error={submitted && (!amountIsValid || amountValue > (sourceAccount?.balance ?? 0))} helperText={submitted && (!amountIsValid || amountValue > (sourceAccount?.balance ?? 0)) ? 'Revisa el monto y el saldo disponible.' : `Disponible: ${money(sourceAccount?.balance ?? 0)}`}/>
            <TextField label="Descripción" value={description} onChange={event => setDescription(event.target.value)} disabled={busy} slotProps={{ htmlInput: { maxLength: 120, autoComplete: 'off' } }} error={submitted && !descriptionIsValid} helperText={submitted && !descriptionIsValid ? 'Máximo 120 caracteres.' : ' '}/>
          </Box>
          {kind === 'OWN' && destinations.length === 0 && <Alert severity="info">Agrega otra cuenta para poder transferir entre tus cuentas.</Alert>}
          {message && <Alert severity={message.severity} role={message.severity === 'error' ? 'alert' : 'status'}>{message.text}</Alert>}
          <Button type="submit" variant="contained" size="large" disabled={busy || !sourceAccount || (kind === 'OWN' && destinations.length === 0)}>
            {busy ? 'Procesando transferencia…' : 'Confirmar transferencia'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
    <Stack spacing={2}>
      <Card><CardContent sx={{ p: 2.5 }}><Typography variant="h6" sx={{ mb: 1, fontSize: 17, fontWeight: 700 }}>Transferencias recientes</Typography>{data.transfers.length ? data.transfers.map(transfer => <Stack key={transfer.id} direction="row" spacing={1} sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 0 }, alignItems: 'center' }}><AccountBalanceOutlinedIcon color="primary" fontSize="small" /><Box sx={{ minWidth: 0, flex: 1 }}><Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>{transfer.recipient}</Typography><Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{transfer.description} · {dateText(transfer.createdAt)}</Typography></Box><StatusBadge status={transfer.status} /><Typography variant="body2" sx={{ fontWeight: 700 }}>-{money(transfer.amount)}</Typography></Stack>) : <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>Aún no hay transferencias registradas.</Typography>}</CardContent></Card>
    </Stack>
  </Box>;
}

