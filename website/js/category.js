document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the categories page or category page
    const isCategoryPage = window.location.pathname.includes('category.html');
    
    if (isCategoryPage) {
        initializeCategoryPage();
    } else {
        initializeCategoriesPage();
    }
});

function initializeCategoriesPage() {
    // Handle "Alle anzeigen" buttons
    const showAllButtons = document.querySelectorAll('.btn-primary');
    showAllButtons.forEach(button => {
        button.addEventListener('click', function() {
            const categoryCard = this.closest('.category-card');
            const categoryName = categoryCard.querySelector('h2').textContent;
            window.location.href = `category.html?category=${encodeURIComponent(categoryName)}`;
        });
    });

    // Handle subcategory links
    const subcategoryLinks = document.querySelectorAll('.category-card ul li a');
    subcategoryLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const categoryCard = this.closest('.category-card');
            const categoryName = categoryCard.querySelector('h2').textContent;
            const subcategoryName = this.textContent.trim();
            window.location.href = `category.html?category=${encodeURIComponent(categoryName)}&subcategory=${encodeURIComponent(subcategoryName)}`;
        });
    });
}

function initializeCategoryPage() {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    const subcategory = urlParams.get('subcategory');

    // Update page title
    const categoryTitle = document.getElementById('categoryTitle');
    if (subcategory) {
        categoryTitle.textContent = `${category} > ${subcategory}`;
    } else {
        categoryTitle.textContent = category;
    }

    // Initialize filters
    initializeFilters();

    // Load items
    loadItems();
}

function initializeFilters() {
    // Sort by change
    document.getElementById('sortBy').addEventListener('change', loadItems);

    // Price filter
    document.getElementById('applyPrice').addEventListener('click', loadItems);

    // Condition checkboxes
    const conditionCheckboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
    conditionCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', loadItems);
    });

    // Location select
    document.getElementById('location').addEventListener('change', loadItems);

    // Pagination
    document.getElementById('prevPage').addEventListener('click', () => changePage(-1));
    document.getElementById('nextPage').addEventListener('click', () => changePage(1));
}

async function loadItems() {
    const itemsGrid = document.getElementById('itemsGrid');
    itemsGrid.innerHTML = '<div class="loading">Lade Artikel...</div>';

    // Get filter values
    const sortBy = document.getElementById('sortBy').value;
    const minPrice = document.getElementById('minPrice').value;
    const maxPrice = document.getElementById('maxPrice').value;
    const conditions = Array.from(document.querySelectorAll('.checkbox-group input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);
    const location = document.getElementById('location').value;

    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    const subcategory = urlParams.get('subcategory');
    const page = urlParams.get('page') || 1;

    // Build API URL
    const apiUrl = new URL('/api/items.php', window.location.origin);
    apiUrl.searchParams.set('category', category);
    if (subcategory) apiUrl.searchParams.set('subcategory', subcategory);
    if (minPrice) apiUrl.searchParams.set('min_price', minPrice);
    if (maxPrice) apiUrl.searchParams.set('max_price', maxPrice);
    if (conditions.length) apiUrl.searchParams.set('condition', conditions.join(','));
    if (location) apiUrl.searchParams.set('location', location);
    apiUrl.searchParams.set('sort', sortBy);
    apiUrl.searchParams.set('page', page);

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();

        if (data.items.length === 0) {
            itemsGrid.innerHTML = `
                <div class="no-items">
                    <i class="fas fa-box-open"></i>
                    <p>Keine Artikel gefunden</p>
                    <p>Bitte versuchen Sie es mit anderen Filtern</p>
                </div>
            `;
        } else {
            itemsGrid.innerHTML = data.items.map(item => createItemCard(item)).join('');
        }

        // Update pagination
        updatePagination(data.pagination);
    } catch (error) {
        console.error('Error loading items:', error);
        itemsGrid.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-circle"></i>
                <p>Fehler beim Laden der Artikel</p>
                <p>Bitte versuchen Sie es später erneut</p>
            </div>
        `;
    }
}

function updatePagination(pagination) {
    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');

    prevButton.disabled = pagination.page <= 1;
    nextButton.disabled = pagination.page >= pagination.total_pages;
    pageInfo.textContent = `Seite ${pagination.page} von ${pagination.total_pages}`;

    // Update URL with current page
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('page', pagination.page);
    window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
}

function changePage(delta) {
    const urlParams = new URLSearchParams(window.location.search);
    const currentPage = parseInt(urlParams.get('page') || '1');
    const newPage = currentPage + delta;
    
    if (newPage > 0) {
        urlParams.set('page', newPage);
        window.location.search = urlParams.toString();
    }
}

function createItemCard(item) {
    return `
        <div class="item-card" data-item-id="${item.id}">
            <div class="item-image">
                <img src="${item.image_url || '../images/placeholder.jpg'}" alt="${item.title}">
            </div>
            <div class="item-details">
                <h3>${item.title}</h3>
                <p class="price">${item.price.toFixed(2)} €</p>
                <p class="location"><i class="fas fa-map-marker-alt"></i> ${item.location}</p>
                <p class="condition"><i class="fas fa-tag"></i> ${getConditionText(item.condition)}</p>
                <p class="seller"><i class="fas fa-user"></i> ${item.first_name} ${item.last_name}</p>
                <div class="item-actions">
                    <button class="btn btn-primary" onclick="viewItem(${item.id})">
                        <i class="fas fa-eye"></i> Ansehen
                    </button>
                    <button class="btn btn-outline" onclick="contactSeller(${item.id})">
                        <i class="fas fa-envelope"></i> Kontakt
                    </button>
                </div>
            </div>
        </div>
    `;
}

function getConditionText(condition) {
    const conditions = {
        'new': 'Neu',
        'like-new': 'Wie neu',
        'good': 'Gut',
        'fair': 'Akzeptabel'
    };
    return conditions[condition] || condition;
}

function viewItem(itemId) {
    window.location.href = `item.html?id=${itemId}`;
}

function contactSeller(itemId) {
    // TODO: Implement contact seller functionality
    console.log('Contact seller for item:', itemId);
} 