
// ========================================
// tarot-diddle
// Prototype 0.1
// ========================================

const STORAGE_KEY = "tarot-diddle-spread";
const MAX_CARDS = 3;

let cards = {};
let spread = [];

// ----------------------------------------
// Initialization
// ----------------------------------------

async function init() {
    try {
        const response = await fetch("./cards.json");

        if (!response.ok) {
            throw new Error("Failed to load cards.json");
        }

        cards = await response.json();

        spread = loadSpread();

        createDebugButtons();
        setupEvents();
        readNFC();
        render();

    } catch (error) {
        console.error(error);

        document.getElementById("status").textContent =
            "Failed to initialize tarot-diddle.";
    }
}

// ----------------------------------------
// Storage
// ----------------------------------------

function loadSpread() {
    try {
        const data = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "[]"
        );

        if (!Array.isArray(data)) {
            return [];
        }

        return [...new Set(data)]
            .filter(id => Object.hasOwn(cards, id))
            .slice(0, MAX_CARDS);

    } catch (error) {
        console.error(error);
        return [];
    }
}

function saveSpread() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(spread)
    );
}

// ----------------------------------------
// NFC
// ----------------------------------------

function readNFC() {
    const url = new URL(window.location.href);
    const cardId = url.searchParams.get("card");

    if (cardId === null) {
        return;
    }

    drawCard(cardId);

    // Prevent repeated registration on reload
    url.searchParams.delete("card");

    history.replaceState(null, "", url);
}

// ----------------------------------------
// Card registration
// ----------------------------------------

function drawCard(id) {
    spread = loadSpread();

    // Unknown card
    if (!Object.hasOwn(cards, id)) {
        console.warn("Unknown card:", id);
        return;
    }

    // Spread is already complete
    if (spread.length >= MAX_CARDS) {
        return;
    }

    // Prevent duplicate cards
    if (spread.includes(id)) {
        return;
    }

    spread.push(id);

    saveSpread();
    render();
}

// ----------------------------------------
// Reset
// ----------------------------------------

function resetSpread() {
    spread = [];

    saveSpread();
    render();
}

// ----------------------------------------
// Rendering
// ----------------------------------------

function render() {
    for (let i = 0; i < MAX_CARDS; i++) {
        const slot = document.getElementById(`slot-${i}`);
        const card = cards[spread[i]];

        if (card) {
            slot.classList.remove("empty");

            slot.innerHTML = `
                <small>${card.roman}</small>
                <h3>${card.name}</h3>
                <p>${card.ja}</p>
                <p>${card.concept}</p>
            `;

        } else {
            slot.classList.add("empty");
            slot.textContent = "Waiting...";
        }
    }

    updateStatus();
    updateDebugButtons();
}

function updateStatus() {
    const messages = [
        "Draw your first card.",
        "Draw your second card.",
        "Draw your third card.",
        "Your reading is complete."
    ];

    document.getElementById("status").textContent =
        messages[spread.length];
}

// ----------------------------------------
// Debug
// ----------------------------------------

function createDebugButtons() {
    const container =
        document.getElementById("debug-buttons");

    container.replaceChildren();

    const sortedCards = Object.values(cards)
        .sort((a, b) => Number(a.id) - Number(b.id));

    for (const card of sortedCards) {
        const button = document.createElement("button");

        button.textContent =
            `${card.roman}. ${card.name}`;

        button.dataset.card = card.id;

        button.addEventListener("click", () => {
            drawCard(card.id);
        });

        container.appendChild(button);
    }
}

function updateDebugButtons() {
    const buttons =
        document.querySelectorAll("[data-card]");

    buttons.forEach(button => {
        button.disabled =
            spread.length >= MAX_CARDS ||
            spread.includes(button.dataset.card);
    });
}

// ----------------------------------------
// Events
// ----------------------------------------

function setupEvents() {
    document.getElementById("reset")
        .addEventListener("click", resetSpread);

    // Synchronize across browser tabs
    window.addEventListener("storage", event => {
        if (event.key === STORAGE_KEY || event.key === null) {
            spread = loadSpread();
            render();
        }
    });

    // Restore state when returning to a page
    window.addEventListener("pageshow", () => {
        spread = loadSpread();
        render();
    });
}

// ----------------------------------------
// Start
// ----------------------------------------

init();
