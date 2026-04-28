function generateThrows() {
    const allThrows = [];

    for (let i = 1; i <= 20; i += 1) {
        allThrows.push({ name: `S${i}`, value: i, finish: false });
        allThrows.push({ name: `D${i}`, value: i * 2, finish: true });
        allThrows.push({ name: `T${i}`, value: i * 3, finish: true });
    }

    allThrows.push({ name: "Bull", value: 50, finish: true });
    return allThrows;
}

const throwsList = generateThrows();
const finishingThrows = throwsList.filter((t) => t.finish);
const preferredFinishes = [40, 32, 24, 16, 50, 36, 30];
const bogeyTips = "Puntuacion bogey para esta modalidad: no hay cierre de 3 dardos, conviene dejar una salida util para el siguiente turno.";
const bogeyScores = [159, 162, 163, 165, 166, 168, 169];
const trainingPlans = {
    principiante: [
        "Objetivo: aprender a dejar dobles comodos (40, 32, 24, 16).",
        "Rutina: 10 rondas empezando en 61-80 y buscando dejar doble en 2 dardos.",
        "Clave: prioriza control de single 20 y single 16 antes que forzar triples."
    ],
    intermedio: [
        "Objetivo: convertir cierres de 2 y 3 dardos de forma consistente.",
        "Rutina: bloques de 20 intentos en 81-100 y 101-130.",
        "Clave: alterna rutas por 20 y 19 para tener plan B cuando fallas el triple."
    ],
    avanzado: [
        "Objetivo: optimizar decisiones de scoring + cierre en una sola ronda.",
        "Rutina: series de presion en 121-170 con limite de tiempo por turno.",
        "Clave: simula partido real y registra porcentaje de checkout por rango."
    ]
};
const tableTargets = [170, 169, 168, 167, 166, 165, 164, 163, 162, 161, 160, 159, 158, 157, 156, 155, 154, 153, 152, 151, 150, 148, 147, 146, 145, 144, 143, 142, 141, 140, 138, 136, 135, 132, 130, 128, 126, 125, 124, 122, 121, 120, 117, 116, 115, 112, 110, 107, 104, 101, 100, 97, 96, 95, 90, 88, 84, 81, 80, 76, 72, 68, 64, 60, 56, 52, 50, 40, 32];

function parsePoints() {
    const rawValue = document.getElementById("points").value;
    const points = Number.parseInt(rawValue, 10);

    if (Number.isNaN(points) || points < 2 || points > 501) {
        return null;
    }

    return points;
}

function findCheckout(points) {
    // 1 dardo: cierre directo.
    for (const last of finishingThrows) {
        if (last.value === points) {
            return [last.name];
        }
    }

    // 2 dardos: primer dardo libre + último de cierre.
    for (const last of finishingThrows) {
        const rem = points - last.value;
        if (rem <= 0) {
            continue;
        }

        for (const first of throwsList) {
            if (first.value === rem) {
                return [first.name, last.name];
            }
        }
    }

    // 3 dardos: dos libres + último de cierre.
    for (const last of finishingThrows) {
        const rem2 = points - last.value;
        if (rem2 <= 0) {
            continue;
        }

        for (const second of throwsList) {
            const rem1 = rem2 - second.value;
            if (rem1 <= 0) {
                continue;
            }

            for (const first of throwsList) {
                if (first.value === rem1) {
                    return [first.name, second.name, last.name];
                }
            }
        }
    }

    return null;
}

function isBogey(points) {
    return bogeyScores.includes(points);
}

function bestNonCheckout(points) {
    if (points > 170) {
        return "T20 (construir turno para bajar)";
    }

    for (const t of throwsList) {
        const rem = points - t.value;
        if (preferredFinishes.includes(rem)) {
            return `${t.name} (dejar ${rem})`;
        }
    }

    if (points > 60) {
        return "T20 (dejar número manejable)";
    }

    if (points > 19) {
        return "T19 (evitar quedar en bogey)";
    }

    const safeSingle = Math.max(1, points - 2);
    return `S${safeSingle} (dejar 2 o buscar bull)`;
}

function buildTrainingGuide(level) {
    const items = trainingPlans[level] || trainingPlans.principiante;
    return `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

function renderTrainingGuide() {
    const level = document.getElementById("level").value;
    const guideDiv = document.getElementById("trainingGuide");
    guideDiv.innerHTML = buildTrainingGuide(level);
}

function renderCheckoutTable() {
    const rows = tableTargets
        .map((score) => {
            if (isBogey(score)) {
                return `<tr class="bogeyRow"><td>${score}</td><td>Bogey</td></tr>`;
            }

            const route = findCheckout(score);
            if (!route) {
                return "";
            }

            return `<tr><td>${score}</td><td>${route.join(" → ")}</td></tr>`;
        })
        .join("");

    const tableHtml = `
        <table>
            <thead>
                <tr>
                    <th>Resta</th>
                    <th>Ruta sugerida</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;

    document.getElementById("checkoutTable").innerHTML = tableHtml;
}

function renderBogeyList() {
    const chips = bogeyScores
        .map((score) => `<span class="chip">${score}</span>`)
        .join("");

    document.getElementById("bogeyList").innerHTML = chips;
}

function calculate() {
    const points = parsePoints();
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = "";

    if (points === null) {
        resultDiv.innerHTML = "<span class='bad'>Introduce un valor válido (2-501).</span>";
        return;
    }

    const checkout = findCheckout(points);

    if (checkout) {
        resultDiv.innerHTML = `<span class='good'>✅ Cierre posible:</span><br>${checkout.join(" → ")}`;
        return;
    }

    const advice = bestNonCheckout(points);
    if (isBogey(points)) {
        resultDiv.innerHTML = `<span class='bad'>⚠️ Bogey detectado.</span><br>${bogeyTips}<br>Mejor opción: <b>${advice}</b>`;
        return;
    }

    resultDiv.innerHTML = `<span class='bad'>❌ No hay cierre este turno.</span><br>Mejor opción: <b>${advice}</b>`;
}

document.getElementById("calculateBtn").addEventListener("click", calculate);
document.getElementById("points").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        calculate();
    }
});

document.getElementById("level").addEventListener("change", renderTrainingGuide);

renderTrainingGuide();
renderCheckoutTable();
renderBogeyList();
