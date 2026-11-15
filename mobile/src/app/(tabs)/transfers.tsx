import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, Text, View } from 'react-native';
import * as Crypto from 'expo-crypto';
import { Card, colors, Field, ListRow, LoadingState, Message, Page, PrimaryButton } from '@/components/ui';
import { useBankingData } from '@/hooks/useBankingData';
import { sendTransfer } from '@/services/bankingApi';
import type { TransferRequest } from '@/types/banking';

const money = (amount: number, currency = 'USD') => new Intl.NumberFormat('es-EC', { style: 'currency', currency }).format(amount);
const banks = ['Banco Andino', 'Cooperativa Sol', 'Banco del Centro'];

export default function TransfersScreen() {
  const { data, loading, error, refresh } = useBankingData();
  const [sourceId, setSourceId] = useState('');
  const [destinationType, setDestinationType] = useState<'OWN' | 'INTERBANK'>('OWN');
  const [destinationId, setDestinationId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [bank, setBank] = useState('');
  const [bankSelected, setBankSelected] = useState(false);
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);
  const idempotencyKey = useRef(Crypto.randomUUID());
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!data?.accounts.length) return;
    setSourceId(current => current || data.accounts[0].id);
  }, [data]);

  const sourceAccount = data?.accounts.find(account => account.id === sourceId);
  const ownDestinations = useMemo(() => data?.accounts.filter(account => account.id !== sourceId) ?? [], [data, sourceId]);
  const bankMatches = bank.trim() ? banks.filter(item => item.toLocaleLowerCase().includes(bank.trim().toLocaleLowerCase())) : [];

  function validate() {
    const value = Number(amount);
    if (!sourceAccount) return 'Selecciona una cuenta de origen.';
    if (!Number.isFinite(value) || value <= 0 || value > 2500 || !/^[0-9]+(\.[0-9]{1,2})?$/.test(amount)) return 'Ingresa un monto de hasta $2.500 con un máximo de dos decimales.';
    if (value > sourceAccount.balance) return 'El monto supera el saldo disponible.';
    if (destinationType === 'OWN' && (!destinationId || destinationId === sourceId)) return 'Selecciona una cuenta de destino diferente.';
    if (destinationType === 'INTERBANK') {
      if (!/^[\p{L}\p{M}][\p{L}\p{M} .'-]{0,99}$/u.test(recipientName.trim())) return 'Escribe un nombre válido para el beneficiario.';
      if (!bankSelected || !banks.includes(bank)) return 'Selecciona un banco de la lista.';
      if (!/^\d{6,20}$/.test(accountNumber)) return 'El número de cuenta debe contener entre 6 y 20 dígitos.';
    }
    if (description.trim().length > 120) return 'La descripción no puede superar 120 caracteres.';
    return null;
  }

  async function submitTransfer() {
    const validation = validate();
    setFormError(validation);
    setSuccess(null);
    if (validation || submitLock.current) return;
    const body: TransferRequest = {
      sourceAccountId: sourceId,
      destinationType,
      destinationAccountId: destinationType === 'OWN' ? destinationId : null,
      recipientName: destinationType === 'INTERBANK' ? recipientName.trim() : null,
      recipientBank: destinationType === 'INTERBANK' ? bank : null,
      destinationAccountNumber: destinationType === 'INTERBANK' ? accountNumber : null,
      amount: Number(amount),
      description: description.trim() || null,
      idempotencyKey: idempotencyKey.current,
    };
    submitLock.current = true;
    setSubmitting(true);
    try {
      const response = await sendTransfer(body);
      setSuccess(response.status === 'PENDING' ? 'Solicitud registrada. La transferencia queda pendiente de confirmación del proveedor.' : 'Transferencia registrada.');
      setAmount('');
      setDescription('');
      setRecipientName('');
      setBank('');
      setBankSelected(false);
      setAccountNumber('');
      idempotencyKey.current = Crypto.randomUUID();
      await refresh();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'No se pudo registrar la transferencia.');
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  }

  const chooseButton = (title: string, selected: boolean, onPress: () => void) => <Pressable key={title} onPress={onPress} accessibilityRole="button" style={{ borderWidth: 1, borderColor: selected ? colors.blue : colors.line, borderRadius: 12, padding: 12, backgroundColor: selected ? colors.pale : colors.white }}><Text style={{ color: selected ? colors.blue : colors.ink, fontWeight: '600' }}>{title}</Text></Pressable>;

  return <Page title="Transferir" subtitle="Envía dinero entre tus cuentas o registra una transferencia a otro banco."
    refreshControl={<RefreshControl refreshing={loading && Boolean(data)} onRefresh={() => void refresh()} tintColor={colors.blue} />}>
    {error ? <Message tone="error">{error}</Message> : null}{loading && !data ? <LoadingState /> : null}
    {data ? <>
      <Card title="Nueva transferencia">
        <Text style={{ color: colors.muted }}>Revisa los datos antes de confirmar.</Text>
        <Text style={{ fontWeight: '700', color: colors.ink }}>Cuenta de origen</Text>
        <View style={{ gap: 8 }}>{data.accounts.map(account => chooseButton(`${account.alias} · •••• ${account.number.slice(-4)} · ${money(account.balance, account.currency)}`, sourceId === account.id, () => { idempotencyKey.current = Crypto.randomUUID(); setSourceId(account.id); }))}</View>
        <Text style={{ fontWeight: '700', color: colors.ink, marginTop: 4 }}>Destino</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>{chooseButton('Cuenta propia', destinationType === 'OWN', () => { idempotencyKey.current = Crypto.randomUUID(); setDestinationType('OWN'); })}{chooseButton('Otro banco', destinationType === 'INTERBANK', () => { idempotencyKey.current = Crypto.randomUUID(); setDestinationType('INTERBANK'); })}</View>
        {destinationType === 'OWN' ? <>
          <Text style={{ color: colors.muted }}>Selecciona la cuenta que recibirá el dinero.</Text>
          {ownDestinations.length ? <View style={{ gap: 8 }}>{ownDestinations.map(account => chooseButton(`${account.alias} · •••• ${account.number.slice(-4)}`, destinationId === account.id, () => { idempotencyKey.current = Crypto.randomUUID(); setDestinationId(account.id); }))}</View> : <Message>No tienes otra cuenta disponible para transferir.</Message>}
        </> : <>
          <Field label="Nombre del beneficiario *" value={recipientName} onChangeText={value => { idempotencyKey.current = Crypto.randomUUID(); setRecipientName(value); }} maxLength={100} autoCapitalize="words" />
          <Field label="Banco *" value={bank} onChangeText={value => { idempotencyKey.current = Crypto.randomUUID(); setBank(value); setBankSelected(false); }} maxLength={80} placeholder="Escribe para buscar un banco" autoCapitalize="words" />
          {bankMatches.length > 0 && !bankSelected ? <View style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 12, overflow: 'hidden' }}>{bankMatches.map(item => <Pressable key={item} onPress={() => { idempotencyKey.current = Crypto.randomUUID(); setBank(item); setBankSelected(true); }} style={{ padding: 13, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.line }}><Text style={{ color: colors.ink }}>{item}</Text></Pressable>)}</View> : null}
          <Field label="Número de cuenta *" value={accountNumber} onChangeText={value => { idempotencyKey.current = Crypto.randomUUID(); setAccountNumber(value.replace(/\D/g, '').slice(0, 20)); }} keyboardType="number-pad" maxLength={20} />
        </>}
        <Field label="Monto (USD) *" value={amount} onChangeText={value => { idempotencyKey.current = Crypto.randomUUID(); setAmount(value.replace(',', '.').replace(/[^0-9.]/g, '').slice(0, 12)); }} keyboardType="decimal-pad" placeholder="0.00" />
        {sourceAccount ? <Text style={{ color: colors.muted, fontSize: 12 }}>Disponible: {money(sourceAccount.balance, sourceAccount.currency)}</Text> : null}
        <Field label="Descripción (opcional)" value={description} onChangeText={value => { idempotencyKey.current = Crypto.randomUUID(); setDescription(value); }} maxLength={120} placeholder="Máximo 120 caracteres" />
        {formError ? <Message tone="error">{formError}</Message> : null}{success ? <Message tone="success">{success}</Message> : null}
        <PrimaryButton title="Confirmar transferencia" onPress={() => void submitTransfer()} loading={submitting} disabled={destinationType === 'OWN' && ownDestinations.length === 0} />
      </Card>
      <Card title="Transferencias recientes">
        {data.transfers.slice(0, 8).map(transfer => <ListRow key={transfer.id} title={transfer.recipient} detail={`${transfer.bank || 'Transferencia propia'} · ${new Date(transfer.createdAt).toLocaleString('es-EC')}`} amount={`−${money(transfer.amount)}`} status={transfer.status} />)}
        {!data.transfers.length ? <Text style={{ color: colors.muted }}>Aún no hay transferencias registradas.</Text> : null}
      </Card>
    </> : null}
  </Page>;
}
