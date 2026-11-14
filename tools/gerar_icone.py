"""Gera o ícone do Vorticis Architecture (icon.svg).

Variação do ícone da família Vorticis (vórtice do Vorticis Monitor), redesenhada em
verde e laranja: bloco arredondado em degradê verde, vórtice de 6 braços em branco e
laranja, e um selo laranja com uma casa (arquitetura) no lugar da linha de pulso.
Uso: python3 -I tools/gerar_icone.py
"""
import math
from pathlib import Path

T = 512
CX, CY = T * 0.45, T * 0.45


def braco(fase: float) -> str:
    esq, dir_ = [], []
    n = 90
    for i in range(n):
        s = i / (n - 1)
        r = T * (0.035 + 0.335 * s)
        ang = fase + 1.55 * math.pi * s
        x, y = CX + r * math.cos(ang), CY + r * math.sin(ang)
        dr, da = T * 0.335, 1.55 * math.pi
        tx = dr * math.cos(ang) - r * da * math.sin(ang)
        ty = dr * math.sin(ang) + r * da * math.cos(ang)
        nrm = math.hypot(tx, ty)
        nx, ny = -ty / nrm, tx / nrm
        meia = T * (0.004 + 0.034 * math.sin(math.pi * min(1, s * 1.15)) ** 0.8)
        esq.append((x + nx * meia, y + ny * meia))
        dir_.append((x - nx * meia, y - ny * meia))
    pts = esq + dir_[::-1]
    return "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts) + "Z"


def svg() -> str:
    bracos = []
    for b in range(6):
        cor = "#ffffff" if b % 2 == 0 else "url(#lar)"
        bracos.append(f'<path d="{braco(2 * math.pi * b / 6)}" fill="{cor}"/>')
    d = T * 0.40
    x0 = y0 = T - d - T * 0.04
    cx, cy, r = x0 + d / 2, y0 + d / 2, d / 2
    m = lambda fx, fy: f"{x0 + d * fx:.1f},{y0 + d * fy:.1f}"
    casa = f"M{m(0.22, 0.50)} L{m(0.50, 0.25)} L{m(0.78, 0.50)} M{m(0.31, 0.43)} L{m(0.31, 0.76)} L{m(0.69, 0.76)} L{m(0.69, 0.43)} M{m(0.44, 0.76)} L{m(0.44, 0.58)} L{m(0.56, 0.58)} L{m(0.56, 0.76)}"
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {T} {T}">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#064e3b"/><stop offset="1" stop-color="#15803d"/></linearGradient>
<linearGradient id="lar" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fdba74"/><stop offset="1" stop-color="#f97316"/></linearGradient>
<linearGradient id="selo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fb923c"/><stop offset="1" stop-color="#ea580c"/></linearGradient>
<filter id="sb" x="-10%" y="-10%" width="130%" height="130%"><feDropShadow dx="4" dy="6" stdDeviation="5" flood-color="#022c22" flood-opacity=".35"/></filter>
</defs>
<rect width="{T}" height="{T}" rx="{T * 0.22:.0f}" fill="url(#bg)"/>
<g filter="url(#sb)">{''.join(bracos)}<circle cx="{CX:.1f}" cy="{CY:.1f}" r="{T * 0.05:.1f}" fill="#ffffff"/></g>
<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r + T * 0.022:.1f}" fill="#064e3b"/>
<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" fill="url(#selo)"/>
<path d="{casa}" fill="none" stroke="#ffffff" stroke-width="{T * 0.03:.1f}" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
'''


if __name__ == "__main__":
    destino = Path(__file__).resolve().parent.parent / "icon.svg"
    destino.write_text(svg(), encoding="utf-8")
    print("ícone gerado em", destino)
