// All dashboard interactivity and dynamic rendering

let allItems = [];
let filteredItems = [];
let currentPage = 1;
const itemsPerPage = 7;

function paginate(items, page, perPage) {
    const start = (page - 1) * perPage;
    return items.slice(start, start + perPage);
}

document.addEventListener('DOMContentLoaded', function () {
    // Fetch and render summary cards, inventory, activity, expiring items, and categories
    fetch('/api/inventory')
        .then(res => res.json())
        .then(items => {
            allItems = items;
            filteredItems = allItems;
            renderSummaryCards(allItems);
            renderInventoryTable(filteredItems);
            renderCategoryList(allItems);
            renderCharts(allItems);
            renderActivityList();
            renderExpiringList();
        });

    // Example: Render summary cards
    function renderSummaryCards(items) {
        const total = items.length;
        const inStock = items.filter(i => i.status === 'good' || i.status === 'medium').length;
        const lowStock = items.filter(i => i.status === 'low').length;
        const outOfStock = items.filter(i => i.quantity === 0).length;
        const cards = [
            { icon: 'fa-boxes', color: 'text-primary', title: 'Total Items', value: total, subtitle: '+3.2% from last month', animate: true },
            { icon: 'fa-check-circle', color: 'text-success', title: 'Items in Stock', value: inStock, subtitle: `${Math.round((inStock/total)*100)}% of total inventory` },
            { icon: 'fa-exclamation-triangle', color: 'text-warning', title: 'Low Stock Items', value: lowStock, subtitle: `${Math.round((lowStock/total)*100)}% of total inventory` },
            { icon: 'fa-times-circle', color: 'text-danger', title: 'Out of Stock', value: outOfStock, subtitle: `${Math.round((outOfStock/total)*100)}% of total inventory` }
        ];
        const container = document.getElementById('summaryCards');
        container.innerHTML = cards.map(card => `
            <div class="col-md-3">
                <div class="card dashboard-card animate__animated animate__bounceIn">
                    <div class="card-body text-center">
                        <div class="card-icon ${card.color}"><i class="fas ${card.icon}"></i></div>
                        <h5 class="card-title">${card.title}</h5>
                        <h2 class="mb-3">${card.value}</h2>
                        <p class="text-muted mb-0">${card.subtitle}</p>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Render inventory table
    function renderInventoryTable(items) {
        const tbody = document.getElementById('inventoryTableBody');
        const paged = paginate(items, currentPage, itemsPerPage);
        tbody.innerHTML = paged.map(item => `
            <tr>
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td>${item.location}</td>
                <td>${item.quantity}</td>
                <td><span class="status-badge status-${item.status}">${statusText(item.status)}</span></td>
                <td>${item.last_updated}</td>
                <td><button class="btn btn-sm btn-outline-primary edit-btn" data-name="${item.name}"><i class="fas fa-edit"></i></button></td>
            </tr>
        `).join('');
        document.getElementById('tableInfo').textContent = `Showing ${paged.length ? (currentPage-1)*itemsPerPage+1 : 0}-${(currentPage-1)*itemsPerPage+paged.length} of ${items.length} items`;
        renderPagination(items.length);
        attachEditHandlers();
    }

    function renderPagination(total) {
        const pageCount = Math.ceil(total / itemsPerPage);
        const pag = document.getElementById('pagination');
        let html = '';
        html += `<li class="page-item${currentPage===1?' disabled':''}"><a class="page-link" href="#" data-page="prev">Previous</a></li>`;
        for(let i=1;i<=pageCount;i++) {
            html += `<li class="page-item${i===currentPage?' active':''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
        }
        html += `<li class="page-item${currentPage===pageCount?' disabled':''}"><a class="page-link" href="#" data-page="next">Next</a></li>`;
        pag.innerHTML = html;
        pag.querySelectorAll('a').forEach(a => {
            a.onclick = function(e) {
                e.preventDefault();
                let p = this.getAttribute('data-page');
                if(p==='prev' && currentPage>1) currentPage--;
                else if(p==='next' && currentPage<pageCount) currentPage++;
                else if(!isNaN(parseInt(p))) currentPage = parseInt(p);
                renderInventoryTable(filteredItems);
            };
        });
    }

    function statusText(status) {
        if (status === 'good') return 'Good Stock';
        if (status === 'medium') return 'Medium Stock';
        if (status === 'low') return 'Low Stock';
        return status;
    }

    // Render category list
    function renderCategoryList(items) {
        const categories = {};
        items.forEach(i => {
            categories[i.category] = (categories[i.category] || 0) + i.quantity;
        });
        const list = document.getElementById('categoryList');
        list.innerHTML = Object.entries(categories).map(([cat, qty]) => `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <strong>${cat}</strong>
                <span class="badge bg-primary rounded-pill">${qty}</span>
            </li>
        `).join('');
    }

    // Render charts
    function renderCharts(items) {
        const categories = {};
        items.forEach(i => {
            categories[i.category] = (categories[i.category] || 0) + i.quantity;
        });
        const categoryCtx = document.getElementById('categoryChart').getContext('2d');
        new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categories),
                datasets: [{
                    data: Object.values(categories),
                    backgroundColor: [
                        '#3498db','#2ecc71','#e74c3c','#f39c12','#8e44ad','#1abc9c','#34495e'
                    ],
                    borderWidth: 1
                }]
            },
            options: {responsive: true, plugins: {legend: {position: 'bottom'}}}
        });
        // Trend chart: mock data for now
        const trendCtx = document.getElementById('trendChart').getContext('2d');
        new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [
                    {label: 'PPE', data: [1200, 1350, 1500, 1650, 1800, 1750], borderColor: '#3498db', backgroundColor: 'rgba(52,152,219,0.1)', tension: 0.3, fill: true},
                    {label: 'Medication', data: [800, 850, 900, 950, 1000, 1050], borderColor: '#2ecc71', backgroundColor: 'rgba(46,204,113,0.1)', tension: 0.3, fill: true},
                    {label: 'Supplies', data: [600, 650, 700, 750, 800, 850], borderColor: '#e74c3c', backgroundColor: 'rgba(231,76,60,0.1)', tension: 0.3, fill: true}
                ]
            },
            options: {responsive: true, plugins: {legend: {position: 'bottom'}}, scales: {y: {beginAtZero: true}}}
        });
    }

    function filterItems(type) {
        if(type==='all') filteredItems = allItems;
        else if(type==='critical') filteredItems = allItems.filter(i=>i.status==='low'||i.quantity<50);
        else if(type==='recent') filteredItems = allItems.slice().sort((a,b)=>new Date(b.last_updated)-new Date(a.last_updated));
        currentPage = 1;
        renderInventoryTable(filteredItems);
    }

    function attachEditHandlers() {
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.onclick = function() {
                alert('Edit functionality coming soon for: ' + this.getAttribute('data-name'));
            };
        });
    }

    function renderActivityList() {
        const activity = [
            {user:'Dr. Sarah Johnson', action:'added', what:'200 Surgical Masks', time:'Today, 9:41 AM'},
            {user:'', action:'low', what:'Insulin stock is running low (120 units remaining)', time:'Yesterday, 4:23 PM', danger:true},
            {user:'Order #38291', action:'received', what:'500 Nitrile Gloves (M)', time:'Yesterday, 2:30 PM'},
            {user:'Nurse Michael', action:'removed', what:'25 Syringes (10ml)', time:'Jun 12, 2023'}
        ];
        document.getElementById('activityList').innerHTML = activity.map(a =>
            `<div class="activity-item${a.danger?' text-danger':''}">
                <p class="mb-1">${a.user?`<strong>${a.user}</strong> `:''}${a.action==='low'?'<strong>':''}${a.what}${a.action==='low'?'</strong>':''}</p>
                <p class="text-muted small mb-0">${a.time}</p>
            </div>`
        ).join('');
    }

    function renderExpiringList() {
        const expiring = [
            {name:'Epinephrine Injections', time:'Expires in 5 days', qty:'15 units', danger:true},
            {name:'Lidocaine 2%', time:'Expires in 7 days', qty:'8 vials', warning:true},
            {name:'Saline Solution (500ml)', time:'Expires in 14 days', qty:'42 bags', warning:true},
            {name:'Morphine Sulfate', time:'Expires in 21 days', qty:'12 vials', warning:true}
        ];
        document.getElementById('expiringList').innerHTML = expiring.map(e =>
            `<div class="expiring-item">
                <div class="d-flex justify-content-between">
                    <strong>${e.name}</strong>
                    <span class="${e.danger?'text-danger':e.warning?'text-warning':''}">${e.time}</span>
                </div>
                <p class="mb-0">${e.qty}</p>
            </div>`
        ).join('');
        // Grid below
        document.getElementById('expiringGrid').innerHTML = expiring.map(e =>
            `<div class="col-md-3"><div class="expiring-item">
                <div class="d-flex justify-content-between">
                    <strong>${e.name}</strong>
                    <span class="${e.danger?'text-danger':e.warning?'text-warning':''}">${e.time.replace('Expires in ','')}</span>
                </div>
                <p class="mb-0">${e.qty}</p>
            </div></div>`
        ).join('');
    }

    // Example: Call RAG estimation endpoint
    window.estimateForPatient = function(patientInfo) {
        return fetch('/api/estimate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({patient_info: patientInfo})
        })
        .then(res => res.json());
    };

    document.getElementById('allItemsBtn').onclick = () => filterItems('all');
    document.getElementById('criticalItemsBtn').onclick = () => filterItems('critical');
    document.getElementById('recentItemsBtn').onclick = () => filterItems('recent');
    document.getElementById('searchBox').oninput = function() {
        const val = this.value.toLowerCase();
        filteredItems = allItems.filter(i =>
            i.name.toLowerCase().includes(val) ||
            i.category.toLowerCase().includes(val) ||
            i.location.toLowerCase().includes(val)
        );
        currentPage = 1;
        renderInventoryTable(filteredItems);
    };

    // Add bouncy animation to cards (using animate.css if available)
    // You can add more UI/UX effects as needed
});
