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
    plt.close(fig)


def c4_context():
    fig, ax = setup("C4 | Contexto del sistema")
    box(ax, 0.7, 4.45, 2.0, 1.0, "Cliente", "SPA web", color="#F2F6F9", edge=MUTED)
    box(ax, 0.7, 2.25, 2.0, 1.0, "Cliente", "App móvil", color="#F2F6F9", edge=MUTED)
    box(ax, 4.2, 3.35, 3.0, 1.4, "BP Digital", "API bancaria\nCuentas · movimientos · transferencias", color=PALE)
    box(ax, 9.0, 4.75, 2.2, 0.95, "Proveedor de identidad", "OAuth 2.0 / OIDC · MFA", color="#F2F6F9", edge=MUTED)
    box(ax, 9.0, 3.15, 2.2, 0.95, "Core bancario", "Datos básicos y productos", color="#F2F6F9", edge=MUTED)
    box(ax, 9.0, 1.55, 2.2, 0.95, "Servicios externos", "Pagos · avisos · liveness", color="#F2F6F9", edge=MUTED)
    arrow(ax, (2.7, 4.9), (4.2, 4.2), "HTTPS")
    arrow(ax, (2.7, 2.75), (4.2, 3.75), "HTTPS")
    arrow(ax, (7.2, 4.2), (9, 5.15), "OIDC")
    arrow(ax, (7.2, 3.95), (9, 3.65), "API", rad=0.05)
    arrow(ax, (7.2, 3.6), (9, 2.1), "Adaptadores futuros")
    ax.text(6, 0.72, "Hoy: API local con SQLite y proveedores desconectados. Las integraciones externas son objetivo de diseño.",
            ha="center", fontsize=9, color=MUTED)
    save(fig, "c4-contexto.png")


def c4_containers():
    fig, ax = setup("C4 | Contenedores y límites de confianza")
    box(ax, 0.6, 4.1, 2.2, 1.1, "SPA", "React · TypeScript", color="#F2F6F9", edge=MUTED)
    box(ax, 0.6, 2.3, 2.2, 1.1, "App móvil", "Expo · React Native", color="#F2F6F9", edge=MUTED)
    box(ax, 4.0, 3.1, 2.7, 1.4, "API", "ASP.NET Core 10\nControladores · aplicación", color=PALE)
    box(ax, 8.0, 4.55, 2.4, 1.0, "Identidad", "Cognito · PKCE · MFA", color="#F2F6F9", edge=MUTED)
    box(ax, 8.0, 3.05, 2.4, 1.0, "Persistencia", "SQLite local → RDS", color="#F2F6F9", edge=MUTED)
    box(ax, 8.0, 1.55, 2.4, 1.0, "Mensajería", "SQS / DLQ / SNS", color="#F2F6F9", edge=MUTED)
    arrow(ax, (2.8, 4.65), (4.0, 4.0), "HTTPS / JSON")
    arrow(ax, (2.8, 2.85), (4.0, 3.55), "HTTPS / JSON")
    arrow(ax, (6.7, 4.0), (8.0, 5.0), "JWT")
    arrow(ax, (6.7, 3.8), (8.0, 3.6), "SQL parametrizado")
    arrow(ax, (6.7, 3.45), (8.0, 2.0), "Eventos")
    ax.text(10.95, 3.5, "Límite de\nproveedores cloud\n(no desplegado)", ha="center", va="center", color=ORANGE, fontsize=8)
    ax.text(5.4, 0.75, "Los clientes son públicos: no contienen client secret ni credenciales AWS.", ha="center", color=MUTED)
    save(fig, "c4-contenedores.png")


def c4_components():
    fig, ax = setup("C4 | Componentes internos de la API")
    box(ax, 0.65, 4.65, 2.2, 0.9, "Controllers", "HTTP · validación de borde")
    box(ax, 3.55, 4.65, 2.25, 0.9, "Application", "Casos de uso · reglas")
    box(ax, 6.55, 4.65, 2.25, 0.9, "Domain", "Transfer · idempotencia")
    box(ax, 9.55, 4.65, 1.8, 0.9, "Data", "Repositorios")
    arrow(ax, (2.85, 5.1), (3.55, 5.1))
    arrow(ax, (5.8, 5.1), (6.55, 5.1))
    arrow(ax, (8.8, 5.1), (9.55, 5.1))
    box(ax, 1.0, 2.55, 2.5, 1.0, "Autorización", "JWT · sub · scope · ACR", color="#F2F6F9", edge=MUTED)
    box(ax, 4.75, 2.55, 2.5, 1.0, "Transfer worker", "Solo transacciones propias", color="#F2F6F9", edge=MUTED)
    box(ax, 8.5, 2.55, 2.5, 1.0, "Integraciones", "Core · cola · notificaciones", color="#FFF5E7", edge=ORANGE, title_color=ORANGE)
    arrow(ax, (1.75, 4.65), (2.1, 3.55))
    arrow(ax, (7.5, 4.65), (6.1, 3.55))
    arrow(ax, (10.4, 4.65), (9.75, 3.55))
    ax.text(6, 1.2, "El código actual resuelve el MVP local; adaptadores cloud y orquestación durable quedan pendientes.",
            ha="center", color=MUTED, fontsize=9)
    save(fig, "c4-componentes.png")


def bpmn(title, name, lanes, steps, footnote):
    fig, ax = setup(title, (13, 7.2))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 7)
    top = 5.65
    lane_h = 1.6
    colors = ["#F7FAFC", "#F2F7FB", "#F7FAFC"]
    for i, lane in enumerate(lanes):
        y = top - (i + 1) * lane_h
        ax.add_patch(FancyBboxPatch((0.45, y), 13.05, lane_h, boxstyle="square,pad=0",
                                    facecolor=colors[i % len(colors)], edgecolor="#C5D2DC", lw=1))
        ax.text(0.62, y + lane_h / 2, lane, rotation=90, ha="center", va="center", color=NAVY,
                fontsize=8, fontweight="bold")
    positions = []
    for i, step in enumerate(steps):
        lane, label, shape, status = step
        y = top - (lane + 1) * lane_h + 0.45
        x = 1.25 + i * 1.72
        positions.append((x, y))
        if shape == "event":
            ax.add_patch(Circle((x + 0.32, y + 0.33), 0.3, fc=WHITE, ec=GREEN if status == "ok" else BLUE, lw=2))
            ax.text(x + 0.32, y - 0.05, label, ha="center", va="top", fontsize=7, color=INK, wrap=True)
        elif shape == "gateway":
            ax.add_patch(Polygon([[x + .32, y + .65], [x + .64, y + .33], [x + .32, y + .01], [x, y + .33]],
                                 closed=True, fc="#FFF5E7", ec=ORANGE, lw=1.5))
            ax.text(x + .32, y + .34, "×", ha="center", va="center", color=ORANGE, fontsize=13, fontweight="bold")
            ax.text(x + .32, y - .05, label, ha="center", va="top", fontsize=7, color=INK, wrap=True)
        else:
            edge = GREEN if status == "ok" else ORANGE if status == "pending" else BLUE
            face = "#EAF6F2" if status == "ok" else "#FFF5E7" if status == "pending" else PALE
            ax.add_patch(FancyBboxPatch((x, y + .06), .72, .54, boxstyle="round,pad=.03,rounding_size=.05",
                                        fc=face, ec=edge, lw=1.4))
            ax.text(x + .36, y + .33, label, ha="center", va="center", fontsize=7, color=INK, wrap=True)
    for i in range(len(positions) - 1):
        x1, y1 = positions[i]
        x2, y2 = positions[i + 1]
        arrow(ax, (x1 + .62, y1 + .33), (x2, y2 + .33), color=GREEN if steps[i][3] == "ok" else MUTED)
    ax.text(7.0, 0.52, footnote, ha="center", va="center", fontsize=8, color=MUTED, wrap=True)
    save(fig, name)


def workflow_figures():
    bpmn("BPMN | Alta digital con verificación facial",
         "bpmn-alta-facial.png",
         ["Cliente", "App móvil", "API / proveedor"],
         [(0, "Inicio", "event", "ok"), (0, "Explica uso y\npide consentimiento", "task", "ok"),
          (0, "¿Acepta?", "gateway", "pending"), (1, "Cancelación\ny alternativa", "task", "ok"),
          (1, "Solicita sesión\na API", "task", "ok"), (2, "Consentimiento\nvalidado", "task", "ok"),
          (2, "Sesión facial\nno configurada", "task", "pending"), (0, "Continuar por\nrevisión asistida", "task", "pending")],
         "Implementado: consentimiento, endpoint autenticado y respuesta 400/503. Sin cámara, liveness ni cotejo documental activos.")
    bpmn("BPMN | Notificación móvil y recuperación",
         "bpmn-notificaciones.png",
         ["API", "Mensajería", "App / usuario"],
         [(0, "Evento\npersistido", "event", "ok"), (0, "Publica evento\ncon ID único", "task", "ok"),
          (1, "Entrega a cola", "task", "pending"), (1, "Reintento con\nbackoff", "task", "pending"),
          (1, "¿Supera límite?", "gateway", "pending"), (1, "Enruta a DLQ", "task", "pending"),
          (2, "Push / aviso\nin-app", "task", "pending"), (2, "Entrega o\npreferencias", "task", "pending")],
         "Implementado: buzón API y notificación local de prueba. SQS/SNS, registro de token push y DLQ son objetivo futuro.")


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
    fig, ax = plt.subplots(figsize=(11, 5.5), dpi=180)
    fig.patch.set_facecolor(WHITE)
    ax.axis("off")
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 6)
    ax.text(.3, 5.55, "AWS Pricing Calculator | Variables pendientes", fontsize=17, color=NAVY, fontweight="bold")
    ax.text(.3, 5.1, "Mapa de partidas para ingresar; no es una estimación monetaria", fontsize=10, color=MUTED)
    cats = [
        ("Identidad", "Cognito MAU", "#EAF3FA"), ("Entrada", "API Gateway · WAF", "#EAF3FA"),
        ("Cómputo", "Fargate · ALB", "#EAF3FA"), ("Datos", "RDS Multi-AZ · DynamoDB", "#EAF3FA"),
        ("Mensajería", "SQS · SNS · SES", "#EAF3FA"), ("Biometría", "Face Liveness", "#FFF5E7"),
        ("Entrega", "S3 · CloudFront", "#EAF3FA"), ("Operación", "CloudWatch · CloudTrail", "#EAF3FA"),
    ]
    for i, (title, sub, color) in enumerate(cats):
        row, col = divmod(i, 4)
        x = .35 + col * 2.9
        y = 3.55 - row * 1.65
        box(ax, x, y, 2.45, .95, title, sub, color=color, edge=ORANGE if title == "Biometría" else BLUE, fs=8)
    ax.text(6, .55, "Valores de uso provisional. Confirmar región, carga, almacenamiento, retención, mensajes y RTO/RPO.",
            ha="center", color=ORANGE, fontsize=9)
    save(fig, "modelo-costos.png")


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
    c4_context()
    c4_containers()
    c4_components()
    workflow_figures()
    results()
    costs()
    risk_matrix()
