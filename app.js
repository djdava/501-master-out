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
    return `S${safeSingle} (dejar 2)`;
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
    resultDiv.innerHTML = `<span class='bad'>❌ No hay cierre.</span><br>Mejor opción: <b>${advice}</b>`;
}

document.getElementById("calculateBtn").addEventListener("click", calculate);
document.getElementById("points").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        calculate();
    }
});
