document.addEventListener('DOMContentLoaded', () => {
    // Beispiel-Produktdaten für die Elektronik-Kategorie
    const products = {
        electronics: {
            smartphones: [
                {
                    id: 1,
                    name: 'iPhone 14 Pro',
                    price: 999.99,
                    condition: 'Neu',
                    location: 'Berlin',
                    image: 'https://via.placeholder.com/300x300',
                    description: 'iPhone 14 Pro 256GB, Space Black, Originalverpackung'
                },
                {
                    id: 2,
                    name: 'Samsung Galaxy S23',
                    price: 899.99,
                    condition: 'Gebraucht',
                    location: 'München',
                    image: 'https://via.placeholder.com/300x300',
                    description: 'Samsung Galaxy S23 Ultra, 512GB, Phantom Black'
                }
            ],
            laptops: [
                {
                    id: 3,
                    name: 'MacBook Pro M2',
                    price: 1499.99,
                    condition: 'Neu',
                    location: 'Hamburg',
                    image: 'https://via.placeholder.com/300x300',
                    description: 'MacBook Pro 14" mit M2 Pro Chip, 16GB RAM, 512GB SSD'
                },
                {
                    id: 4,
                    name: 'Dell XPS 15',
                    price: 1299.99,
                    condition: 'Gebraucht',
                    location: 'Frankfurt',
                    image: 'https://via.placeholder.com/300x300',
                    description: 'Dell XPS 15, i7, 16GB RAM, 1TB SSD, RTX 3050'
                }
            ],
            tablets: [
                {
                    id: 5,
                    name: 'iPad Pro 12.9"',
                    price: 1099.99,
                    condition: 'Neu',
                    location: 'Köln',
                    image: 'https://via.placeholder.com/300x300',
                    description: 'iPad Pro 12.9" 2023, 256GB, WiFi + Cellular'
                }
            ],
            audio: [
                {
                    id: 6,
                    name: 'Sony WH-1000XM5',
                    price: 349.99,
                    condition: 'Neu',
                    location: 'Düsseldorf',
                    image: 'https://via.placeholder.com/300x300',
                    description: 'Sony WH-1000XM5 Noise Cancelling Headphones'
                }
            ]
        }
    };

    // URL-Parameter auslesen
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('cat');
    const subcategory = urlParams.get('sub');

    // Wenn wir auf einer Kategorieseite sind, Produkte laden
    if (category && subcategory) {
        loadCategoryProducts(category, subcategory);
    }

    // Klick-Handler für Kategorie-Links hinzufügen
    const categoryLinks = document.querySelectorAll('.subcategories a');
    categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            window.location.href = href;
        });
    });
});

// Produkte für eine bestimmte Kategorie laden
function loadCategoryProducts(category, subcategory) {
    const mainContent = document.querySelector('main');
    if (!mainContent) return;

    // Produkte für die ausgewählte Kategorie abrufen
    const categoryProducts = products[category]?.[subcategory] || [];
    
    // Kategorieseiten-Inhalt erstellen
    const categoryTitle = document.querySelector('h1');
    if (categoryTitle) {
        categoryTitle.textContent = getCategoryTitle(category, subcategory);
    }

    // Produkt-Grid erstellen
    const productsGrid = document.createElement('div');
    productsGrid.className = 'listings-grid';

    if (categoryProducts.length === 0) {
        productsGrid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-box-open"></i>
                <p>Keine Produkte in dieser Kategorie gefunden</p>
            </div>
        `;
    } else {
        categoryProducts.forEach(product => {
            const productCard = createProductCard(product);
            productsGrid.appendChild(productCard);
        });
    }

    // Filter-Bereich hinzufügen
    const filtersSection = createFiltersSection();
    mainContent.appendChild(filtersSection);
    mainContent.appendChild(productsGrid);
}

// Produktkarte erstellen
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
        <div class="product-image">
            <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="product-info">
            <h3>${product.name}</h3>
            <p class="price">${product.price.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
            <p class="condition">${product.condition}</p>
            <p class="location"><i class="fas fa-map-marker-alt"></i> ${product.location}</p>
            <p class="description">${product.description}</p>
            <button class="contact-btn">Kontaktieren</button>
        </div>
    `;

    // Klick-Handler für Kontakt-Button hinzufügen
    const contactBtn = card.querySelector('.contact-btn');
    contactBtn.addEventListener('click', () => {
        showContactModal(product);
    });

    return card;
}

// Filter-Bereich erstellen
function createFiltersSection() {
    const filters = document.createElement('div');
    filters.className = 'filters-section';
    filters.innerHTML = `
        <div class="filters-header">
            <h2>Filter</h2>
            <button class="clear-filters">Filter zurücksetzen</button>
        </div>
        <div class="filter-group">
            <h3>Preis</h3>
            <div class="price-range">
                <input type="number" placeholder="Min" class="price-min">
                <span>-</span>
                <input type="number" placeholder="Max" class="price-max">
            </div>
        </div>
        <div class="filter-group">
            <h3>Zustand</h3>
            <label><input type="checkbox" value="neu"> Neu</label>
            <label><input type="checkbox" value="gebraucht"> Gebraucht</label>
        </div>
        <div class="filter-group">
            <h3>Standort</h3>
            <select class="location-filter">
                <option value="">Alle Standorte</option>
                <option value="berlin">Berlin</option>
                <option value="munchen">München</option>
                <option value="hamburg">Hamburg</option>
                <option value="frankfurt">Frankfurt</option>
                <option value="koln">Köln</option>
                <option value="dusseldorf">Düsseldorf</option>
            </select>
        </div>
        <button class="apply-filters">Filter anwenden</button>
    `;

    // Event-Listener für Filter hinzufügen
    const applyBtn = filters.querySelector('.apply-filters');
    applyBtn.addEventListener('click', applyFilters);

    const clearBtn = filters.querySelector('.clear-filters');
    clearBtn.addEventListener('click', clearFilters);

    return filters;
}

// Kontakt-Modal anzeigen
function showContactModal(product) {
    const modal = document.createElement('div');
    modal.className = 'contact-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Kontakt zum Verkäufer</h2>
            <p>Produkt: ${product.name}</p>
            <p>Preis: ${product.price.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
            <form class="contact-form">
                <div class="form-group">
                    <label for="message">Ihre Nachricht</label>
                    <textarea id="message" required placeholder="Schreiben Sie Ihre Nachricht an den Verkäufer..."></textarea>
                </div>
                <div class="form-actions">
                    <button type="submit" class="send-btn">Nachricht senden</button>
                    <button type="button" class="cancel-btn">Abbrechen</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // Event-Listener hinzufügen
    const form = modal.querySelector('.contact-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = form.querySelector('#message').value;
        // Hier würde normalerweise die Nachricht an den Backend-Server gesendet werden
        showNotification('Nachricht wurde erfolgreich gesendet', 'success');
        modal.remove();
    });

    const cancelBtn = modal.querySelector('.cancel-btn');
    cancelBtn.addEventListener('click', () => {
        modal.remove();
    });
}

// Filter anwenden
function applyFilters() {
    // Hier würde normalerweise die Filterlogik implementiert werden
    showNotification('Filter wurden angewendet', 'info');
}

// Filter zurücksetzen
function clearFilters() {
    const inputs = document.querySelectorAll('.filters-section input, .filters-section select');
    inputs.forEach(input => {
        if (input.type === 'checkbox') {
            input.checked = false;
        } else {
            input.value = '';
        }
    });
    showNotification('Filter wurden zurückgesetzt', 'info');
}

// Kategorietitel abrufen
function getCategoryTitle(category, subcategory) {
    const titles = {
        electronics: {
            smartphones: 'Smartphones',
            laptops: 'Laptops & Computer',
            tablets: 'Tablets',
            audio: 'Audio & HiFi',
            photo: 'Foto & Kamera',
            gaming: 'Gaming & Konsolen',
            tv: 'TV & Video',
            smart: 'Smart Home'
        }
        // Weitere Kategorien hier hinzufügen
    };

    return titles[category]?.[subcategory] || 'Kategorie';
}

// Benachrichtigung anzeigen
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
} 