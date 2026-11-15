from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Circle, Polygon


ROOT = Path(__file__).parent / "diagramas"
ROOT.mkdir(parents=True, exist_ok=True)
NAVY = "#123A55"
BLUE = "#1670B8"
PALE = "#EAF3FA"
GREEN = "#168A72"
ORANGE = "#B86E13"
RED = "#B43C3C"
INK = "#172B3D"
MUTED = "#64798C"
WHITE = "#FFFFFF"
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 10})


def setup(title, size=(12, 6.5)):
    fig, ax = plt.subplots(figsize=size, dpi=180)
    fig.patch.set_facecolor(WHITE)
    ax.set_facecolor(WHITE)
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 7)
    ax.axis("off")
    ax.text(0.35, 6.65, title, fontsize=18, fontweight="bold", color=NAVY, va="center")
    ax.plot([0.35, 11.65], [6.3, 6.3], color=BLUE, lw=2)
    return fig, ax


def box(ax, x, y, w, h, title, body="", color=PALE, edge=BLUE, title_color=NAVY, fs=9):
    p = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.04,rounding_size=0.12",
                       facecolor=color, edgecolor=edge, linewidth=1.5)
    ax.add_patch(p)
    ax.text(x + w / 2, y + h * 0.66, title, ha="center", va="center", color=title_color,
            fontsize=fs + 1, fontweight="bold", wrap=True)
    if body:
        ax.text(x + w / 2, y + h * 0.31, body, ha="center", va="center", color=INK,
                fontsize=fs, wrap=True, linespacing=1.35)


def arrow(ax, a, b, label=None, color=MUTED, rad=0):
    p = FancyArrowPatch(a, b, arrowstyle="-|>", mutation_scale=14, lw=1.5, color=color,
                        connectionstyle=f"arc3,rad={rad}", shrinkA=4, shrinkB=4)
    ax.add_patch(p)
    if label:
        ax.text((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 0.14, label, ha="center",
                color=MUTED, fontsize=8, bbox={"facecolor": WHITE, "edgecolor": "none", "pad": 1})


def save(fig, name):
    fig.savefig(ROOT / name, dpi=200, bbox_inches="tight", facecolor=WHITE)
    if name.startswith("c4-"):
        fig.savefig(ROOT / f"{Path(name).stem}.pdf", bbox_inches="tight", facecolor=WHITE)
    plt.close(fig)


def c4_context():
    fig, ax = setup("C4 | Contexto del sistema")
    box(ax, 0.55, 4.65, 2.0, 0.9, "Cliente bancario", "Persona usuaria", color="#F2F6F9", edge=MUTED)
    box(ax, 0.55, 2.45, 2.0, 0.9, "Canales BP", "SPA web · App movil", color="#F2F6F9", edge=MUTED)
    box(ax, 4.0, 3.15, 3.0, 1.55, "BP Digital", "Sistema bancario\nCuentas\nmovimientos\ntransferencias", color=PALE)
    box(ax, 8.55, 5.25, 2.8, 0.85, "Proveedor de identidad", "OAuth 2.0 / OIDC · MFA", color="#F2F6F9", edge=MUTED)
    box(ax, 8.55, 4.0, 2.8, 0.85, "Core y sistema de detalle", "Titularidad · productos · actividad", color="#F2F6F9", edge=MUTED)
    box(ax, 8.55, 2.75, 2.8, 0.85, "Red de pagos", "Procesamiento interbancario", color="#F2F6F9", edge=MUTED)
    box(ax, 8.55, 1.5, 2.8, 0.85, "Proveedores de servicio", "Liveness · correo · push", color="#F2F6F9", edge=MUTED)
    arrow(ax, (1.55, 4.65), (1.55, 3.35), "usa")
    arrow(ax, (2.55, 2.9), (4.0, 4.0), "HTTPS / JSON")
    arrow(ax, (7.0, 4.15), (8.55, 5.65), "OIDC")
    arrow(ax, (7.0, 3.95), (8.55, 4.45), "API / Core")
    arrow(ax, (7.0, 3.75), (8.55, 3.2), "API / pagos")
    arrow(ax, (7.0, 3.55), (8.55, 1.95), "eventos / adaptadores")
    ax.text(6, 0.65, "Las integraciones externas son objetivo de diseno; el MVP actual usa SQLite y no conecta estos proveedores.",
            ha="center", fontsize=9, color=MUTED)
    save(fig, "c4-contexto.png")

def c4_containers():
    fig, ax = setup("C4 | Contenedores y límites de confianza")
    box(ax, 0.6, 4.1, 2.2, 1.1, "SPA", "React · TypeScript", color="#F2F6F9", edge=MUTED)
    box(ax, 0.6, 2.3, 2.2, 1.1, "App móvil", "Expo · React Native", color="#F2F6F9", edge=MUTED)
    box(ax, 4.0, 3.1, 2.7, 1.4, "API", "ASP.NET Core 10\nECS Fargate objetivo", color=PALE)
    box(ax, 8.0, 4.55, 2.4, 1.0, "Identidad", "Cognito · PKCE · MFA", color="#F2F6F9", edge=MUTED)
    box(ax, 8.0, 3.05, 2.4, 1.0, "Persistencia", "SQLite local → RDS", color="#F2F6F9", edge=MUTED)
    box(ax, 8.0, 1.55, 2.4, 1.0, "Mensajería", "SQS / DLQ / SNS", color="#F2F6F9", edge=MUTED)
    arrow(ax, (2.8, 4.65), (4.0, 4.0), "HTTPS / JSON")
    arrow(ax, (2.8, 2.85), (4.0, 3.55), "HTTPS / JSON")
    arrow(ax, (6.7, 4.0), (8.0, 5.0), "JWT")
    arrow(ax, (6.7, 3.8), (8.0, 3.6), "SQL parametrizado")
    arrow(ax, (6.7, 3.45), (8.0, 2.0), "Eventos")
    ax.text(10.95, 3.5, "Límite de\nproveedores cloud\n(no desplegado)", ha="center", va="center", color=ORANGE, fontsize=8)
    ax.text(5.4, 0.75, "Cloud objetivo: CloudFront/WAF → API Gateway → ECS Fargate (no desplegado). Clientes sin secretos AWS.", ha="center", color=MUTED)
    save(fig, "c4-contenedores.png")


def c4_components():
    fig, ax = setup("C4 | Componentes de la API")
    box(ax, 0.55, 4.75, 2.0, 0.9, "API Gateway / WAF", "AWS objetivo · TLS", color="#FFF5E7", edge=ORANGE, title_color=ORANGE)
    box(ax, 3.0, 4.75, 2.0, 0.9, "Controllers", "HTTPS/JSON · validación")
    box(ax, 5.45, 4.75, 2.0, 0.9, "Application", "casos de uso por dominio")
    box(ax, 7.9, 4.75, 2.0, 0.9, "Domain services", "cliente · movimientos\ntransferencias · onboarding")
    box(ax, 10.25, 4.75, 1.35, 0.9, "Data", "SQL")
    arrow(ax, (2.55, 5.2), (3.0, 5.2), "TLS")
    arrow(ax, (5.0, 5.2), (5.45, 5.2), "interno")
    arrow(ax, (7.45, 5.2), (7.9, 5.2), "interno")
    arrow(ax, (9.9, 5.2), (10.25, 5.2), "param.")
    box(ax, 0.75, 2.55, 2.25, 1.0, "Autorización", "JWT · issuer · scope\nACR/AMR · subject", color="#F2F6F9", edge=MUTED)
    box(ax, 3.8, 2.55, 2.25, 1.0, "Persistencia", "SQLite MVP → RDS\nPostgreSQL objetivo", color="#F2F6F9", edge=MUTED)
    box(ax, 6.85, 2.55, 2.25, 1.0, "Mensajería AWS", "Outbox · SQS · DLQ\nEventBridge objetivo", color="#FFF5E7", edge=ORANGE, title_color=ORANGE)
    box(ax, 9.9, 2.55, 1.8, 1.0, "Adaptadores", "Core · pagos\nCognito · facial", color="#FFF5E7", edge=ORANGE, title_color=ORANGE)
    arrow(ax, (3.55, 4.75), (2.35, 3.55), "JWT validado")
    arrow(ax, (8.9, 4.75), (5.0, 3.55), "repositorio")
    arrow(ax, (8.9, 4.75), (7.95, 3.55), "TLS · IAM")
    arrow(ax, (8.9, 4.75), (10.8, 3.55), "TLS · OAuth")
    ax.text(6, 1.35, "Cloud objetivo: API Gateway/WAF · ECS Fargate · RDS · SQS/DLQ · Cognito",
            ha="center", color=ORANGE, fontsize=9, fontweight="bold")
    ax.text(6, 0.78, "MVP actual: API modular y worker local; los servicios cloud no estan desplegados.",
            ha="center", color=MUTED, fontsize=9)
    save(fig, "c4-componentes.png")

def process_diagram(title, name, lanes, nodes, flows, footnote):
    """Draw a BPMN-style process with clear lanes and labeled branches."""
    lane_h = 1.28
    top = 7.18
    fig, ax = plt.subplots(figsize=(14, 7.2), dpi=180)
    fig.patch.set_facecolor(WHITE)
    ax.set_facecolor(WHITE)
    ax.set_xlim(0, 18)
    ax.set_ylim(0, 8.2)
    ax.axis("off")
    ax.text(9, 7.96, title, fontsize=18, fontweight="bold", color=NAVY, ha="center", va="center")
    ax.plot([0.35, 17.65], [7.65, 7.65], color=BLUE, lw=2)
    for i, lane in enumerate(lanes):
        y = top - (i + 1) * lane_h
        ax.add_patch(FancyBboxPatch((0.45, y), 17.05, lane_h, boxstyle="square,pad=0",
                                    facecolor="#F7FAFC" if i % 2 == 0 else "#F0F6FA",
                                    edgecolor="#C5D2DC", lw=1))
        ax.text(0.72, y + lane_h / 2, lane, rotation=90, ha="center", va="center",
                color=NAVY, fontsize=9, fontweight="bold")

    centers = {}
    node_kind = {}
    for key, x, lane, label, kind in nodes:
        cy = top - (lane + 0.5) * lane_h
        centers[key] = (x, cy)
        node_kind[key] = kind
        if kind in ("start", "end"):
            ax.add_patch(Circle((x, cy), 0.23, fc=WHITE,
                                ec=GREEN if kind == "end" else BLUE,
                                lw=2.5 if kind == "end" else 1.8))
            ax.text(x, cy - 0.32, label, ha="center", va="top", fontsize=8.5, color=INK)
        elif kind == "gateway":
            d = 0.38
            ax.add_patch(Polygon([[x, cy + d], [x + d, cy], [x, cy - d], [x - d, cy]],
                                 closed=True, fc="#FFF5E7", ec=ORANGE, lw=1.7))
            ax.text(x, cy, "×", ha="center", va="center", color=ORANGE, fontsize=15, fontweight="bold")
            ax.text(x, cy - 0.48, label, ha="center", va="top", fontsize=8.2, color=INK)
        else:
            w, h = 1.7, 0.78
            ax.add_patch(FancyBboxPatch((x - w / 2, cy - h / 2), w, h,
                                        boxstyle="round,pad=0.06,rounding_size=0.10",
                                        fc="#EAF6F2" if kind == "implemented" else PALE,
                                        ec=GREEN if kind == "implemented" else BLUE, lw=1.6))
            ax.text(x, cy, label, ha="center", va="center", fontsize=8.8,
                    color=INK, wrap=True, linespacing=1.2)

    for source, target, label, curve in flows:
        x1, y1 = centers[source]
        x2, y2 = centers[target]
        forward = x2 >= x1
        source_gap = {"start": 0.23, "end": 0.23, "gateway": 0.38}.get(node_kind[source], 0.85)
        target_gap = {"start": 0.23, "end": 0.23, "gateway": 0.38}.get(node_kind[target], 0.85)
        start = (x1 + (source_gap if forward else -source_gap), y1)
        end = (x2 - (target_gap if forward else -target_gap), y2)
        ax.add_patch(FancyArrowPatch(start, end, arrowstyle="-|>", mutation_scale=13,
                                     lw=1.45, color=GREEN if label in ("Sí", "entregado") else MUTED,
                                     connectionstyle=f"arc3,rad={curve}", shrinkA=2, shrinkB=2))
        if label:
            mx, my = (start[0] + end[0]) / 2, (start[1] + end[1]) / 2
            ax.text(mx, my + (0.34 if label in ("Sí", "No") else 0.16), label, ha="center", va="bottom", fontsize=8,
                    color=MUTED, bbox={"facecolor": WHITE, "edgecolor": "none", "pad": 1})
    ax.text(9, 0.42, footnote, ha="center", va="center", fontsize=10,
            color=MUTED, wrap=True)
    save(fig, name)


def workflow_figures():
    onboarding_nodes = [
        ("start", 1.35, 0, "Inicio", "start"),
        ("disclose", 3.0, 1, "Informa el uso\ny pide consentimiento", "implemented"),
        ("consent", 4.9, 0, "Otorga\nconsentimiento", "implemented"),
        ("consent_gate", 6.7, 0, "¿Consiente?", "gateway"),
        ("alternative", 8.6, 0, "Ofrece alternativa\nregistra rechazo", "task"),
        ("end_alt", 10.4, 0, "Fin", "end"),
        ("session", 8.6, 2, "Valida el permiso\ny crea la sesión", "implemented"),
        ("verify", 10.8, 3, "Prueba de vida\n+ cotejo con ID", "task"),
        ("match_gate", 12.8, 3, "¿Coincide?", "gateway"),
        ("activate", 14.7, 1, "Activa la cuenta\ny confirma al cliente", "task"),
        ("end_ok", 16.35, 0, "Fin", "end"),
        ("review", 14.7, 3, "Revisión humana\ndel caso dudoso", "task"),
        ("end_review", 16.35, 3, "Fin", "end"),
    ]
    onboarding_flows = [
        ("start", "disclose", "", 0), ("disclose", "consent", "", 0),
        ("consent", "consent_gate", "", 0),
        ("consent_gate", "session", "Sí", -0.06),
        ("consent_gate", "alternative", "No", 0.08),
        ("alternative", "end_alt", "", 0), ("session", "verify", "", 0),
        ("verify", "match_gate", "", 0), ("match_gate", "activate", "Sí", -0.08),
        ("activate", "end_ok", "", 0), ("match_gate", "review", "No", 0.08),
        ("review", "end_review", "", 0),
    ]
    process_diagram("BPMN | Alta digital con verificación facial", "bpmn-alta-facial.png",
                    ["Cliente", "App móvil", "API BP", "Proveedor / revisión"],
                    onboarding_nodes, onboarding_flows,
                    "MVP: consentimiento y contrato de sesión preparados. Cámara, liveness, cotejo y activación automática siguen pendientes.")

    notification_nodes = [
        ("start", 1.35, 0, "Inicio", "start"),
        ("persist", 3.0, 0, "Guarda operación\nen outbox", "implemented"),
        ("queue", 4.8, 1, "Publica en cola\n(ID único)", "task"),
        ("consume", 6.7, 1, "Consume evento\ny valida ID", "task"),
        ("send", 8.4, 1, "Envía aviso\npor canal", "task"),
        ("channel", 10.4, 2, "Push FCM/APNs,\ncorreo SES / in-app", "task"),
        ("delivery_gate", 12.4, 2, "¿Entregado?", "gateway"),
        ("update", 14.3, 0, "Registra estado\nde entrega", "task"),
        ("end_ok", 16.0, 0, "Fin", "end"),
        ("retry", 14.0, 1, "Espera y reintenta\ncon backoff", "task"),
        ("limit_gate", 15.4, 1, "¿Límite agotado?", "gateway"),
        ("dead", 16.8, 1, "Envía a DLQ\ny alerta", "task"),
    ]
    notification_flows = [
        ("start", "persist", "", 0), ("persist", "queue", "", -0.05),
        ("queue", "consume", "", 0), ("consume", "send", "", 0),
        ("send", "channel", "", 0), ("channel", "delivery_gate", "", 0),
        ("delivery_gate", "update", "", -0.08), ("update", "end_ok", "", 0),
        ("delivery_gate", "retry", "", 0.06), ("retry", "limit_gate", "", 0),
        ("limit_gate", "dead", "", 0), ("limit_gate", "send", "", 0.24),
    ]
    process_diagram("BPMN | Notificaciones y recuperación de entrega", "bpmn-notificaciones.png",
                    ["API / outbox", "Cola y workers", "Canales / usuario"],
                    notification_nodes, notification_flows,
                    "MVP: outbox y prueba local. Push remoto, consumidores, reintentos, DLQ y alertas son objetivos de integración.")


def results():
    fig, ax = plt.subplots(figsize=(10, 5.5), dpi=180)
    fig.patch.set_facecolor(WHITE)
    ax.set_facecolor(WHITE)
    labels = ["API checks", "Web build", "Web audit\n(high+)", "Mobile typecheck", "Android bundle"]
    values = [27, 1, 1, 1, 1]
    cols = [GREEN] * 5
    bars = ax.barh(labels[::-1], values[::-1], color=cols[::-1], height=.55)
    ax.set_xlim(0, 30)
    ax.set_xticks([0, 5, 10, 15, 20, 25, 30])
    ax.grid(axis="x", alpha=.18)
    ax.set_axisbelow(True)
    for b, v, text in zip(bars, values[::-1], ["OK", "OK", "0 vulnerabilidades", "OK", "27/27"]):
        ax.text(v + .5, b.get_y() + b.get_height() / 2, text, va="center", fontsize=9, color=INK)
    ax.spines[["top", "right", "left"]].set_visible(False)
    ax.spines["bottom"].set_color("#C5D2DC")
    ax.tick_params(axis="y", length=0, labelcolor=INK)
    ax.tick_params(axis="x", colors=MUTED)
    ax.set_title("Verificaciones ejecutadas en el MVP local", loc="left", color=NAVY, fontsize=16, fontweight="bold", pad=18)
    fig.text(.12, .03, "Las métricas no representan producción, AWS, pruebas E2E ni dispositivos físicos.", color=MUTED, fontsize=8)
    fig.tight_layout(rect=(0, .08, 1, 1))
    save(fig, "resultados-pruebas.png")


def costs():
    import csv

    rows = list(csv.DictReader((ROOT.parent.parent / "aws-estimate-assumptions.csv").open(encoding="utf-8")))
    items = [(r["service"], float(r["monthly_usd"])) for r in rows if float(r["monthly_usd"]) > 0]
    items.sort(key=lambda item: item[1])
    total = sum(value for _, value in items)

    fig, ax = plt.subplots(figsize=(11, 6.2), dpi=180)
    fig.patch.set_facecolor(WHITE)
    ax.set_facecolor(WHITE)
    labels, values = zip(*items)
    bars = ax.barh(labels, values, color=[ORANGE if name == "Amazon VPC" else BLUE for name in labels], height=.62)
    ax.set_xlim(0, max(values) * 1.25)
    ax.grid(axis="x", alpha=.18)
    ax.set_axisbelow(True)
    for bar, value in zip(bars, values):
        ax.text(value + .8, bar.get_y() + bar.get_height() / 2, f"${value:,.2f}", va="center", color=INK, fontsize=9)
    ax.spines[["top", "right", "left"]].set_visible(False)
    ax.spines["bottom"].set_color("#C5D2DC")
    ax.tick_params(axis="y", length=0, labelcolor=INK)
    ax.tick_params(axis="x", colors=MUTED)
    ax.set_xlabel("USD por mes", color=MUTED)
    ax.set_title(f"Estimación mensual provisional | us-east-1 | ${total:,.2f}", loc="left", color=NAVY, fontsize=15, fontweight="bold", pad=18)
    fig.text(.12, .02, "Supuestos de baja demanda; tarifas públicas consultadas 15-nov-2026. No es una cotización de AWS. Partidas en nivel gratuito figuran en $0.", color=MUTED, fontsize=8)
    fig.tight_layout(rect=(0, .06, 1, 1))
    save(fig, "modelo-costos.png")

    base_without_nat = total - dict(items)["Amazon VPC"]
    one_nat = 44.70
    scenarios = [base_without_nat + one_nat, total]
    labels = ["1 NAT gateway\nmenor costo, sin HA por AZ", "2 NAT gateways\nHA de salida por AZ"]
    fig, ax = plt.subplots(figsize=(10, 4.8), dpi=180)
    fig.patch.set_facecolor(WHITE)
    ax.set_facecolor(WHITE)
    bars = ax.barh(labels, scenarios, color=[ORANGE, GREEN], height=.5)
    ax.set_xlim(0, max(scenarios) * 1.25)
    ax.grid(axis="x", alpha=.18)
    ax.set_axisbelow(True)
    for bar, value in zip(bars, scenarios):
        ax.text(value + 2, bar.get_y() + bar.get_height() / 2, f"${value:,.2f}/mes", va="center", color=INK, fontsize=11, fontweight="bold")
    ax.spines[["top", "right", "left"]].set_visible(False)
    ax.spines["bottom"].set_color("#C5D2DC")
    ax.tick_params(axis="y", length=0, labelcolor=INK)
    ax.tick_params(axis="x", colors=MUTED)
    ax.set_xlabel("USD por mes", color=MUTED)
    ax.set_title("Sensibilidad: topología de salida privada", loc="left", color=NAVY, fontsize=15, fontweight="bold", pad=18)
    fig.text(.12, .025, "Ambos escenarios incluyen 2 direcciones IPv4 del ALB y 20 GB de procesamiento NAT. El escenario de 1 NAT reduce la tolerancia a fallos.", color=MUTED, fontsize=8)
    fig.tight_layout(rect=(0, .07, 1, 1))
    save(fig, "escenarios-costos.png")



def risk_matrix():
    fig, ax = plt.subplots(figsize=(8, 6), dpi=180)
    matrix = [[1, 2, 3], [2, 2, 3], [2, 3, 3]]
    color_map = {1: "#EAF6F2", 2: "#FFF1D9", 3: "#FBE7E7"}
    for y in range(3):
        for x in range(3):
            ax.add_patch(FancyBboxPatch((x, y), .96, .96, boxstyle="square,pad=0", fc=color_map[matrix[y][x]], ec=WHITE))
    risks = [(0, 2, "MFA real\nCognito"), (1, 2, "Onboarding\nfacial real"), (2, 2, "Interbancaria\nconciliación"),
             (0, 1, "Push remoto\nFCM/APNs"), (1, 1, "Aprovisionar\nsub ↔ cliente"), (2, 1, "Auditoría\ninmutable")]
    for x, y, t in risks:
        ax.text(x + .48, y + .5, t, ha="center", va="center", fontsize=8, color=INK, fontweight="bold")
    ax.set_xlim(0, 3)
    ax.set_ylim(0, 3)
    ax.set_xticks([.5, 1.5, 2.5], ["Baja", "Media", "Alta"])
    ax.set_yticks([.5, 1.5, 2.5], ["Baja", "Media", "Alta"])
    ax.set_xlabel("Probabilidad de brecha / fallo", color=NAVY)
    ax.set_ylabel("Impacto", color=NAVY)
    ax.set_title("Riesgos de integración aún abiertos", loc="left", color=NAVY, fontsize=15, fontweight="bold", pad=18)
    ax.tick_params(length=0, labelcolor=INK)
    for spine in ax.spines.values():
        spine.set_visible(False)
    fig.tight_layout()
    save(fig, "matriz-riesgos.png")


if __name__ == "__main__":
    workflow_figures()
    results()
    costs()
    risk_matrix()
