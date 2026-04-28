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
const tableTargets = [];
for (let score = 180; score >= 32; score -= 1) {
    tableTargets.push(score);
}
const trainingPlans = {
    principiante: [
        "Objetivo: dominar dobles comodos (40, 32, 24, 16) y aprovechar la diana (Bull = 50) como zona segura.",
        "Rutina: 10 rondas empezando en 61-100. Busca cerrar en 2 o 3 dardos sin forzar triples.",
        "Clave 1: Bull es vuestra zona habitual; usalo como dardo de scoring o cierre cuando ayude (ej. 100 = Bull + Bull).",
        "Clave 2: prioriza S20/S19 para preparar doble. Solo busca triple si la app te lo recomienda explicitamente."
    ],
    intermedio: [
        "Objetivo: convertir cierres de 2 y 3 dardos mezclando bull y maximo 1 triple por ronda.",
        "Rutina: bloques de 20 intentos en 81-140. Apunta primero a la diana cuando la resta lo permite (ej. 110 = Bull + D5 + Bull).",
        "Clave 1: si fallas el triple (cae single), no improvises: la app te recoloca con la nueva resta. Esa es la idea de plan B.",
        "Clave 2: alterna rutas por T20/T19 + bull para entrenar mas de un camino al cierre."
    ],
    avanzado: [
        "Objetivo: maxima eficiencia. Cierra en 1-2 dardos siempre que sea posible y gestiona los bogeys (159, 162, 163, 165, 166, 168, 169).",
        "Rutina: series de presion en 121-170 con limite de tiempo por turno y registro de % de checkout.",
        "Clave 1: la app puede pedirte 2-3 triples (ej. 132 = T20+T20+T4 o 170 = T20+T20+Bull): asume el plan completo.",
        "Clave 2: ante un bogey, no insistas en cerrar: el objetivo es dejarte 40/32/24/16 o 50 para el siguiente turno."
    ]
};

const coachState = {
    active: false,
    currentRemaining: null,
    lastPlan: null,
    level: "principiante"
};

function findCheckout(points) {
    for (const last of finishingThrows) {
        if (last.value === points) {
            return [last.name];
        }
    }

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
    return points >= 2 && points <= 180 && findCheckout(points) === null;
}

function getBogeyScores() {
    const bogeys = [];
    for (let score = 2; score <= 180; score += 1) {
        if (isBogey(score)) {
            bogeys.push(score);
        }
    }
    return bogeys;
}

function getThrowValue(throwName) {
    if (throwName === "Bull") {
        return 50;
    }

    const mult = throwName[0];
    const base = Number.parseInt(throwName.slice(1), 10);
    if (Number.isNaN(base)) {
        return 0;
    }

    if (mult === "S") {
        return base;
    }
    if (mult === "D") {
        return base * 2;
    }
    if (mult === "T") {
        return base * 3;
    }
    return 0;
}

function isTripleThrow(throwName) {
    return throwName.startsWith("T");
}

function isDoubleThrow(throwName) {
    return throwName.startsWith("D");
}

function parsePointsInput(inputId, min, max) {
    const rawValue = document.getElementById(inputId).value;
    const points = Number.parseInt(rawValue, 10);

    if (Number.isNaN(points) || points < min || points > max) {
        return null;
    }
    return points;
}

function bestNonCheckout(points) {
    if (points > 170) {
        return "T20";
    }

    for (const t of throwsList) {
        const rem = points - t.value;
        if (preferredFinishes.includes(rem)) {
            return t.name;
        }
    }

    if (points > 60) {
        return "T20";
    }
    if (points > 19) {
        return "T19";
    }
    return `S${Math.max(1, points - 2)}`;
}

function getLevelConfig(level) {
    const configs = {
        principiante: {
            preferredLeaves: [50, 40, 32, 24, 16, 20, 12, 8],
            maxTriplesOnCheckout: 1,
            highScoreTarget: "Bull",
            name: "principiante"
        },
        intermedio: {
            preferredLeaves: [50, 40, 32, 24, 16, 36, 30, 20],
            maxTriplesOnCheckout: 2,
            highScoreTarget: "Bull",
            name: "intermedio"
        },
        avanzado: {
            preferredLeaves: [50, 40, 32, 24, 16, 36, 30],
            maxTriplesOnCheckout: 3,
            highScoreTarget: "T20",
            name: "avanzado"
        }
    };

    return configs[level] || configs.principiante;
}

function getCheckoutCandidates(points) {
    const candidates = [];
    const seen = new Set();

    for (const last of finishingThrows) {
        if (last.value === points) {
            const route = [last.name];
            const key = route.join("-");
            if (!seen.has(key)) {
                seen.add(key);
                candidates.push(route);
            }
        }
    }

    for (const last of finishingThrows) {
        const rem = points - last.value;
        if (rem <= 0) {
            continue;
        }

        for (const first of throwsList) {
            if (first.value === rem) {
                const route = [first.name, last.name];
                const key = route.join("-");
                if (!seen.has(key)) {
                    seen.add(key);
                    candidates.push(route);
                }
            }
        }
    }

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
                    const route = [first.name, second.name, last.name];
                    const key = route.join("-");
                    if (!seen.has(key)) {
                        seen.add(key);
                        candidates.push(route);
                    }
                }
            }
        }
    }

    return candidates;
}

function scoreRouteForLevel(route, level) {
    const triples = route.filter((name) => isTripleThrow(name)).length;
    const bulls = route.filter((name) => name === "Bull").length;
    const first = route[0];
    const last = route[route.length - 1];
    const lastValue = getThrowValue(last);
    const easyDoubles = [40, 32, 24, 16];
    const easyFirsts = ["S20", "S19", "S18", "S16", "Bull"];
    let score = 0;

    score += route.length * 60;

    score -= bulls * 35;

    if (level === "principiante") {
        score += triples * 220;
        if (isTripleThrow(first)) {
            score += 80;
        }
        if (easyFirsts.includes(first)) {
            score -= 50;
        }
        if (first === "Bull") {
            score -= 30;
        }
        if (easyDoubles.includes(lastValue)) {
            score -= 90;
        }
        if (lastValue === 40) {
            score -= 30;
        }
        if (last === "Bull") {
            score -= 60;
        }
        if (isDoubleThrow(last) && lastValue > 32) {
            score += 30;
        }
    } else if (level === "intermedio") {
        score += triples * 80;
        if (triples >= 2) {
            score += 60;
        }
        if (first === "T20" || first === "T19" || first === "Bull") {
            score -= 30;
        }
        if (easyDoubles.includes(lastValue) || lastValue === 50) {
            score -= 40;
        }
        if (last === "Bull") {
            score -= 50;
        }
    } else {
        score -= route.length * 25;
        score -= triples * 10;
        if (first === "T20") {
            score -= 25;
        }
        if (last === "Bull" || lastValue === 40 || lastValue === 32) {
            score -= 30;
        }
    }

    return score;
}

function selectCheckoutForLevel(points, level) {
    const candidates = getCheckoutCandidates(points);
    if (candidates.length === 0) {
        return null;
    }

    const scored = candidates.map((route) => ({
        route,
        score: scoreRouteForLevel(route, level)
    }));

    scored.sort((a, b) => a.score - b.score);
    return scored[0].route;
}

function bestNonCheckoutForLevel(points, level) {
    const config = getLevelConfig(level);

    if (points > 180) {
        return config.highScoreTarget;
    }

    const candidates = throwsList
        .filter((t) => points - t.value > 1)
        .map((t) => {
            const rem = points - t.value;
            const inPreferred = config.preferredLeaves.indexOf(rem);
            const isTriple = isTripleThrow(t.name);
            const isDouble = isDoubleThrow(t.name);
            const isBullThrow = t.name === "Bull";
            let score = 0;

            score += inPreferred === -1 ? 200 : inPreferred * 10;

            if (isBullThrow) {
                score -= 30;
            }

            if (level === "principiante") {
                if (isTriple) {
                    score += 250;
                }
                if (t.name === "S20" || t.name === "S19") {
                    score -= 30;
                }
                if (isBullThrow) {
                    score -= 40;
                }
                if (isDouble) {
                    score += 60;
                }
            } else if (level === "intermedio") {
                if (t.name === "T20" || t.name === "T19") {
                    score -= 60;
                }
                if (isBullThrow) {
                    score -= 50;
                }
                if (isTriple) {
                    score -= 20;
                }
            } else {
                if (t.name === "T20") {
                    score -= 80;
                }
                if (isTriple) {
                    score -= 40;
                }
                if (isBullThrow) {
                    score -= 30;
                }
                if (rem >= 100) {
                    score += 30;
                }
            }

            if (rem <= 1) {
                score += 500;
            }
            return { name: t.name, score };
        });

    candidates.sort((a, b) => a.score - b.score);
    return candidates.length > 0 ? candidates[0].name : "Bull";
}

function explainCheckoutRoute(route, level) {
    const triples = route.filter((name) => isTripleThrow(name)).length;
    const bulls = route.filter((name) => name === "Bull").length;
    const last = route[route.length - 1];
    const lastValue = getThrowValue(last);
    const dartCount = route.length;
    const parts = [];

    if (dartCount === 1) {
        parts.push(`Cierre directo de 1 dardo a ${last}.`);
    } else if (dartCount === 2) {
        parts.push(`Cierre en 2 dardos: primero ${route[0]} y luego ${last}.`);
    } else {
        parts.push(`Cierre en 3 dardos: ${route.join(" → ")}.`);
    }

    if (level === "principiante") {
        if (triples === 0 && bulls === 0) {
            parts.push("Ruta sin triples ni bulls: ideal para tu nivel, foco en control y doble final.");
        } else if (triples === 0 && bulls > 0) {
            parts.push(`Aprovecha la diana (${bulls} bull(s)): zona comoda y sin necesidad de triple.`);
        } else if (triples > 0 && bulls > 0) {
            parts.push(`Lleva ${triples} triple(s) y ${bulls} bull(s). El bull es comodo, el triple es la parte delicada: si lo fallas, te replanificamos.`);
        } else if (triples > 0) {
            parts.push(`Esta resta exige ${triples} triple(s). Si fallas el triple, te recolocamos el plan.`);
        }
    } else if (level === "intermedio") {
        if (triples === 0 && bulls === 0) {
            parts.push("Ruta sin triples ni bulls: cumple sin riesgo.");
        } else if (triples === 0 && bulls > 0) {
            parts.push(`Apoyate en la diana (${bulls} bull(s)): vuestra zona habitual, sin forzar triples.`);
        } else if (triples === 1) {
            parts.push("Solo 1 triple: ruta estandar, equilibrada.");
        } else if (triples >= 2) {
            parts.push(`Lleva ${triples} triples: ten plan B mental si fallas alguno.`);
        }
    } else {
        if (dartCount === 1) {
            parts.push("Cierre eficiente de 1 dardo.");
        } else if (triples === 0 && bulls > 0) {
            parts.push(`Ruta apoyada en la diana (${bulls} bull(s)): rapida y sin forzar triples.`);
        } else if (triples === 0) {
            parts.push("Sin triples: ruta segura aunque hay alternativas mas rapidas.");
        } else {
            parts.push(`Ruta agresiva con ${triples} triple(s): optima en presion si la confias.`);
        }
    }

    if (isDoubleThrow(last)) {
        if ([40, 32, 24, 16].includes(lastValue)) {
            parts.push(`Doble final comodo (${last} = ${lastValue}).`);
        } else {
            parts.push(`Cierre por ${last} (${lastValue}).`);
        }
    } else if (last === "Bull") {
        parts.push("Cierre por Bull (50): vuestra zona habitual, mas facil que un triple.");
    } else if (isTripleThrow(last)) {
        parts.push(`Cierre por ${last} (master out: el triple cierra).`);
    }

    return parts.join(" ");
}

function explainSetup(points, target, level, bogey) {
    const targetValue = getThrowValue(target);
    const remainingAfter = points - targetValue;
    const parts = [];

    if (bogey) {
        parts.push(`Resta ${points} es bogey: imposible cerrar en 3 dardos.`);
    } else {
        parts.push(`Con ${points} no hay cierre recomendable en este turno.`);
    }

    parts.push(`Apunta a ${target} (${targetValue}) para dejar ${remainingAfter}.`);

    if ([40, 32, 24, 16].includes(remainingAfter)) {
        parts.push(`${remainingAfter} es un doble comodo para cerrar el siguiente turno.`);
    } else if (remainingAfter === 50) {
        parts.push("Dejar 50 te da bull o D25 como cierre claro.");
    } else if (preferredFinishes.includes(remainingAfter)) {
        parts.push(`${remainingAfter} es una salida estandar para el siguiente turno.`);
    } else if (remainingAfter > 100 && level === "avanzado") {
        parts.push("Sigues construyendo: prioriza maxima puntuacion para acercarte al rango de cierre.");
    } else if (level === "principiante") {
        parts.push(`Aun lejos del cierre, controla single 20/19 sin forzar triple.`);
    }

    return parts.join(" ");
}

function suggestPlay(points, level = "intermedio") {
    const checkout = selectCheckoutForLevel(points, level);
    if (checkout) {
        const primaryTarget = checkout[0];
        return {
            type: "checkout",
            points,
            target: primaryTarget,
            targetValue: getThrowValue(primaryTarget),
            route: checkout,
            reason: explainCheckoutRoute(checkout, level)
        };
    }

    const bogey = isBogey(points);
    const setupTarget = bestNonCheckoutForLevel(points, level);
    return {
        type: bogey ? "bogey" : "setup",
        points,
        target: setupTarget,
        targetValue: getThrowValue(setupTarget),
        route: null,
        reason: explainSetup(points, setupTarget, level, bogey)
    };
}

function renderCoachPlan(plan, feedbackHtml = "") {
    const instructionDiv = document.getElementById("coachInstruction");
    const routeText = plan.route ? `<br>Ruta sugerida: <b>${plan.route.join(" → ")}</b>` : "";
    instructionDiv.innerHTML = `
        ${feedbackHtml}
        <span class="good">Siguiente objetivo:</span> <b>${plan.target}</b><br>
        Te quedan: <b>${plan.points}</b>${routeText}<br>
        <span class="noteInline">Por que: ${plan.reason}</span>
    `;
}

function chooseStartScore(level) {
    const levelRanges = {
        principiante: { min: 61, max: 100 },
        intermedio: { min: 81, max: 140 },
        avanzado: { min: 121, max: 170 }
    };

    const selected = levelRanges[level] || levelRanges.principiante;
    const candidates = [];
    for (let score = selected.min; score <= selected.max; score += 1) {
        candidates.push(score);
    }

    const idx = Math.floor(Math.random() * candidates.length);
    return candidates[idx];
}

function buildTrainingGuide(level) {
    const items = trainingPlans[level] || trainingPlans.principiante;
    return `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

function renderTrainingGuide() {
    const level = document.getElementById("level").value;
    document.getElementById("trainingGuide").innerHTML = buildTrainingGuide(level);
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

    document.getElementById("checkoutTable").innerHTML = `
        <table>
            <thead>
                <tr><th>Resta</th><th>Ruta sugerida</th></tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;
}

function renderBogeyList() {
    const bogeyScores = getBogeyScores();
    document.getElementById("bogeyList").innerHTML = bogeyScores
        .map((score) => `<span class="chip">${score}</span>`)
        .join("");
}

function startCoachSession() {
    const level = document.getElementById("level").value;
    const startScore = chooseStartScore(level);
    const initialPlan = suggestPlay(startScore, level);

    coachState.active = true;
    coachState.currentRemaining = startScore;
    coachState.lastPlan = initialPlan;
    coachState.level = level;

    document.getElementById("coachStatus").textContent = `Reto ${level} iniciado en ${startScore}. Lanza y luego indica en cuanto te has quedado.`;
    renderCoachPlan(initialPlan);
    document.getElementById("remainingAfterThrow").value = "";
}

function buildFeedback(previousRemaining, newRemaining, previousPlan) {
    if (!previousPlan) {
        return "";
    }

    if (newRemaining === previousRemaining) {
        return "<div class='bad'>No bajaste puntuacion. Si fue bust, el marcador no cambia: vuelve a construir una salida segura.</div>";
    }

    if (newRemaining > previousRemaining) {
        return "<div class='bad'>Valor invalido: no puedes subir la resta. Revisa el dato introducido.</div>";
    }

    const scored = previousRemaining - newRemaining;
    const expected = previousPlan.targetValue;
    if (scored === expected) {
        return `<div class='good'>Buen dardo: hiciste exactamente lo planificado (${previousPlan.target}).</div>`;
    }

    if (scored > expected) {
        return `<div class='good'>Buen ajuste: puntuaste ${scored}, mas de lo planificado (${expected}).</div>`;
    }

    return `<div class='bad'>No salio el plan (${previousPlan.target}). Marcaste ${scored}; ahora ajustamos la mejor opcion con la nueva resta.</div>`;
}

function updateCoach() {
    if (!coachState.active) {
        document.getElementById("coachStatus").textContent = "Primero inicia un reto guiado.";
        return;
    }

    const newRemaining = parsePointsInput("remainingAfterThrow", 0, 501);
    if (newRemaining === null) {
        document.getElementById("coachInstruction").innerHTML = "<span class='bad'>Introduce una resta valida (0-501).</span>";
        return;
    }

    const previousRemaining = coachState.currentRemaining;
    if (newRemaining > previousRemaining) {
        document.getElementById("coachInstruction").innerHTML = "<span class='bad'>Esa resta es mayor que la anterior. Revisa el dato.</span>";
        return;
    }

    if (newRemaining === 0) {
        coachState.active = false;
        coachState.currentRemaining = 0;
        coachState.lastPlan = null;
        document.getElementById("coachStatus").textContent = "Reto completado.";
        document.getElementById("coachInstruction").innerHTML = "<span class='good'>Checkout completado. Muy bien, reto terminado.</span>";
        return;
    }

    if (newRemaining === 1) {
        document.getElementById("coachInstruction").innerHTML = "<span class='bad'>La resta 1 no es jugable para cierre. Si hiciste bust, deja la resta anterior.</span>";
        return;
    }

    const feedback = buildFeedback(previousRemaining, newRemaining, coachState.lastPlan);
    const nextPlan = suggestPlay(newRemaining, coachState.level);
    coachState.currentRemaining = newRemaining;
    coachState.lastPlan = nextPlan;
    document.getElementById("coachStatus").textContent = `Nueva resta registrada: ${newRemaining}.`;
    renderCoachPlan(nextPlan, feedback);
    document.getElementById("remainingAfterThrow").value = "";
}

function calculate() {
    const points = parsePointsInput("points", 2, 501);
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = "";

    if (points === null) {
        resultDiv.innerHTML = "<span class='bad'>Introduce un valor valido (2-501).</span>";
        return;
    }

    const level = document.getElementById("level").value;
    const plan = suggestPlay(points, level);
    if (plan.type === "checkout") {
        resultDiv.innerHTML = `<span class='good'>Cierre propuesto:</span><br><b>${plan.route.join(" → ")}</b><br>Por que: ${plan.reason}`;
        return;
    }

    const advice = plan.target;
    if (isBogey(points)) {
        resultDiv.innerHTML = `<span class='bad'>Bogey detectado.</span><br>No hay cierre en 3 dardos.<br>Mejor opcion: <b>${advice}</b><br>Por que: ${plan.reason}`;
        return;
    }

    resultDiv.innerHTML = `<span class='bad'>No hay cierre este turno.</span><br>Mejor opcion: <b>${advice}</b><br>Por que: ${plan.reason}`;
}

function handleLevelChange() {
    renderTrainingGuide();

    if (!coachState.active) {
        return;
    }

    const selectedLevel = document.getElementById("level").value;
    coachState.level = selectedLevel;
    const adjustedPlan = suggestPlay(coachState.currentRemaining, selectedLevel);
    coachState.lastPlan = adjustedPlan;
    document.getElementById("coachStatus").textContent = `Nivel cambiado a ${selectedLevel}. Plan actualizado para la resta ${coachState.currentRemaining}.`;
    renderCoachPlan(adjustedPlan, "<div class='good'>Nivel actualizado durante la sesion.</div>");
}

document.getElementById("calculateBtn").addEventListener("click", calculate);
document.getElementById("points").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        calculate();
    }
});
document.getElementById("startCoachBtn").addEventListener("click", startCoachSession);
document.getElementById("updateCoachBtn").addEventListener("click", updateCoach);
document.getElementById("remainingAfterThrow").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        updateCoach();
    }
});
document.getElementById("level").addEventListener("change", handleLevelChange);

renderTrainingGuide();
renderCheckoutTable();
renderBogeyList();
