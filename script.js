// Global variables
let customers = JSON.parse(localStorage.getItem('tuckShopCustomers')) || [];
let currentCustomerId = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as default
    document.getElementById('borrow-date').valueAsDate = new Date();
    
    // Add event listeners
    document.getElementById('borrowing-form').addEventListener('submit', handleBorrowingForm);
    document.getElementById('search-customer').addEventListener('input', searchCustomers);
    
    // Calculate total when amounts change
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('item-amount')) {
            calculateTotal();
        }
    });
    
    // Load initial data
    displayCustomers();
    loadPaymentCustomers();
});

// Tab switching functionality
function showTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    
    // Refresh data when switching tabs
    if (tabName === 'customer-list') {
        displayCustomers();
    } else if (tabName === 'make-payment') {
        loadPaymentCustomers();
    }
}

// Add new goods item row
function addGoodsItem() {
    const goodsList = document.getElementById('goods-list');
    const newItem = document.createElement('div');
    newItem.className = 'goods-item';
    newItem.innerHTML = `
        <input type="text" placeholder="Item name" class="item-name" required>
        <input type="number" placeholder="Qty" class="item-quantity" min="1" required>
        <input type="number" placeholder="Amount" class="item-amount" step="0.01" min="0" required>
        <button type="button" class="remove-item" onclick="removeGoodsItem(this)">×</button>
    `;
    goodsList.appendChild(newItem);
}

// Remove goods item row
function removeGoodsItem(button) {
    const goodsItems = document.querySelectorAll('.goods-item');
    if (goodsItems.length > 1) {
        button.parentElement.remove();
        calculateTotal();
    } else {
        alert('At least one item is required!');
    }
}

// Calculate total amount
function calculateTotal() {
    const amountInputs = document.querySelectorAll('.item-amount');
    const quantityItems = document.querySelectorAll('.item-quantity');
    let total = 0;
    
    for(let i=0;i<quantityItems.length;i++)
    {
        const value=parseFloat(amountInputs[i].value) || 0 ;
        const quantity=parseInt( quantityItems[i].value) || 0; 
        total=total+ (value*quantity); 
    }

    // amountInputs.forEach(input => {
    //     const value = parseFloat(input.value) || 0 * ;
    //     total += value;
    // });
    
    document.getElementById('total-amount').textContent = total.toFixed(2);
}

// Handle borrowing form submission
function handleBorrowingForm(e) {
    e.preventDefault();
    
    const name = document.getElementById('customer-name').value.trim();
    const phone = document.getElementById('customer-phone').value.trim();
    const date = document.getElementById('borrow-date').value;
    
    // Collect goods data
    const goodsItems = document.querySelectorAll('.goods-item');
    const goods = [];
    let totalAmount = 0;
    
    goodsItems.forEach(item => {
        const itemName = item.querySelector('.item-name').value.trim();
        const quantity = parseInt(item.querySelector('.item-quantity').value) || 0;
        const amount = parseFloat(item.querySelector('.item-amount').value) || 0;
        
        if (itemName && quantity > 0 && amount > 0) {
            goods.push({
                name: itemName,
                quantity: quantity,
                amount: amount
            });
            totalAmount =totalAmount+ (amount*quantity);
        }
    });
    
    if (goods.length === 0) {
        alert('Please add at least one valid item!');
        return;
    }
    
    // Find or create customer
    let customer = customers.find(c => c.phone === phone);
    
    if (!customer) {
        customer = {
            id: Date.now().toString(),
            name: name,
            phone: phone,
            records: [],
            payments: [],
            totalDebt: 0
        };
        customers.push(customer);
    } else {
        // Update name if different
        customer.name = name;
    }
    
    // Add new borrowing record
    const record = {
        id: Date.now().toString(),
        date: date,
        goods: goods,
        totalAmount: totalAmount
    };
    
    customer.records.push(record);
    customer.totalDebt += totalAmount;
    
    // Save to localStorage
    localStorage.setItem('tuckShopCustomers', JSON.stringify(customers));
    
    // Reset form
    document.getElementById('borrowing-form').reset();
    document.getElementById('borrow-date').valueAsDate = new Date();
    
    // Reset goods list to single item
    const goodsList = document.getElementById('goods-list');
    goodsList.innerHTML = `
        <div class="goods-item">
            <input type="text" placeholder="Item name" class="item-name" required>
            <input type="number" placeholder="Qty" class="item-quantity" min="1" required>
            <input type="number" placeholder="Amount" class="item-amount" step="0.01" min="0" required>
            <button type="button" class="remove-item" onclick="removeGoodsItem(this)">×</button>
        </div>
    `;
    
    calculateTotal();
    
    alert(`Record added successfully for ${name}!\nTotal amount: Rs ${totalAmount.toFixed(2)}`);
    
    // Refresh displays
    displayCustomers();
    loadPaymentCustomers();
}

// Display customers list
function displayCustomers() {
    const container = document.getElementById('customers-container');
    
    if (customers.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 40px;">No customer records found.</p>';
        return;
    }
    
    // Sort customers by total debt (highest first)
    const sortedCustomers = [...customers].sort((a, b) => b.totalDebt - a.totalDebt);
    
    container.innerHTML = sortedCustomers.map(customer => `
        <div class="customer-card" onclick="showCustomerDetails('${customer.id}')">
            <div class="customer-info">
                <div class="customer-details">
                    <h3>${customer.name}</h3>
                    <p>📞 ${customer.phone}</p>
                    <p>📋 ${customer.records.length} record(s)</p>
                </div>
                <div class="debt-amount ${customer.totalDebt <= 0 ? 'paid' : ''}">
                    Rs ${customer.totalDebt.toFixed(2)}
                </div>
            </div>
        </div>
    `).join('');
}

// Search customers
function searchCustomers() {
    const searchTerm = document.getElementById('search-customer').value.toLowerCase();
    const filteredCustomers = customers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm) || 
        customer.phone.includes(searchTerm)
    );
    
    const container = document.getElementById('customers-container');
    
    if (filteredCustomers.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 40px;">No customers found matching your search.</p>';
        return;
    }
    
    container.innerHTML = filteredCustomers.map(customer => `
        <div class="customer-card" onclick="showCustomerDetails('${customer.id}')">
            <div class="customer-info">
                <div class="customer-details">
                    <h3>${customer.name}</h3>
                    <p>📞 ${customer.phone}</p>
                    <p>📋 ${customer.records.length} record(s)</p>
                </div>
                <div class="debt-amount ${customer.totalDebt <= 0 ? 'paid' : ''}">
                    Rs ${customer.totalDebt.toFixed(2)}
                </div>
            </div>
        </div>
    `).join('');
}

// Show customer details in modal
function showCustomerDetails(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    const modalBody = document.getElementById('modal-body');
    
    modalBody.innerHTML = `
        <h2>${customer.name}</h2>
        <p><strong>Phone:</strong> ${customer.phone}</p>
        <p><strong>Total Debt:</strong> <span style="color: ${customer.totalDebt > 0 ? '#dc3545' : '#28a745'}; font-weight: bold;">Rs ${customer.totalDebt.toFixed(2)}</span></p>
        
        <h3 style="margin-top: 30px; color: #2c3e50;">Borrowing Records</h3>
        ${customer.records.length === 0 ? '<p>No borrowing records found.</p>' : 
            customer.records.map(record => `
                <div class="record-item">
                    <div class="record-header">
                        <span class="record-date">${formatDate(record.date)}</span>
                        <span class="record-amount">Rs ${record.totalAmount.toFixed(2)}</span>
                    </div>
                    <div class="goods-list">
                        <strong>Items:</strong>
                        <ul>
                            ${record.goods.map(item => `
                                <li>
                                    <span>${item.name} (Qty: ${item.quantity})</span>
                                    <span>Rs ${item.amount.toFixed(2)}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            `).join('')
        }
        
        ${customer.payments.length > 0 ? `
            <div class="payment-history">
                <h4>Payment History</h4>
                ${customer.payments.map(payment => `
                    <div class="payment-item">
                        <span>${formatDate(payment.date)} - ${payment.type}</span>
                        <span style="color: #28a745; font-weight: bold;">-Rs ${payment.amount.toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
        ` : ''}
    `;
    
    document.getElementById('customer-modal').style.display = 'block';
}

// Close modal
function closeModal() {
    document.getElementById('customer-modal').style.display = 'none';
}

// Load customers for payment dropdown
function loadPaymentCustomers() {
    const select = document.getElementById('payment-customer');
    const customersWithDebt = customers.filter(c => c.totalDebt > 0);
    
    select.innerHTML = '<option value="">-- Select Customer --</option>' +
        customersWithDebt.map(customer => 
            `<option value="${customer.id}">${customer.name} - ${customer.phone} (Rs ${customer.totalDebt.toFixed(2)})</option>`
        ).join('');
}

// Load customer debt information
function loadCustomerDebt() {
    const customerId = document.getElementById('payment-customer').value;
    const paymentDetails = document.getElementById('payment-details');
    
    if (!customerId) {
        paymentDetails.style.display = 'none';
        return;
    }
    
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    currentCustomerId = customerId;
    document.getElementById('current-debt').textContent = customer.totalDebt.toFixed(2);
    document.getElementById('payment-amount').value = '';
    document.getElementById('payment-amount').max = customer.totalDebt;
    
    paymentDetails.style.display = 'block';
}

// Make partial payment
function makePartialPayment() {
    const paymentAmount = parseFloat(document.getElementById('payment-amount').value);
    const customer = customers.find(c => c.id === currentCustomerId);
    
    if (!customer) {
        alert('Please select a customer first!');
        return;
    }
    
    if (!paymentAmount || paymentAmount <= 0) {
        alert('Please enter a valid payment amount!');
        return;
    }
    
    if (paymentAmount > customer.totalDebt) {
        alert('Payment amount cannot exceed the total debt!');
        return;
    }
    
    // Record payment
    const payment = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        amount: paymentAmount,
        type: 'Partial Payment'
    };
    
    customer.payments.push(payment);
    customer.totalDebt -= paymentAmount;
    
    // Save to localStorage
    localStorage.setItem('tuckShopCustomers', JSON.stringify(customers));
    
    alert(`Payment of Rs ${paymentAmount.toFixed(2)} recorded successfully!\nRemaining debt: Rs ${customer.totalDebt.toFixed(2)}`);
    
    // Refresh displays
    loadCustomerDebt();
    loadPaymentCustomers();
    displayCustomers();
}

// Clear all debt
function clearAllDebt() {
    const customer = customers.find(c => c.id === currentCustomerId);
    
    if (!customer) {
        alert('Please select a customer first!');
        return;
    }
    
    if (customer.totalDebt <= 0) {
        alert('This customer has no outstanding debt!');
        return;
    }
    
    if (confirm(`Are you sure you want to clear all debt of Rs ${customer.totalDebt.toFixed(2)} for ${customer.name}?`)) {
        // Record payment
        const payment = {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            amount: customer.totalDebt,
            type: 'Full Payment'
        };
        
        customer.payments.push(payment);
        customer.totalDebt = 0;
        
        // Save to localStorage
        localStorage.setItem('tuckShopCustomers', JSON.stringify(customers));
        
        alert(`All debt cleared for ${customer.name}!`);
        
        // Refresh displays
        document.getElementById('payment-details').style.display = 'none';
        document.getElementById('payment-customer').value = '';
        loadPaymentCustomers();
        displayCustomers();
    }
}

// Utility function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('customer-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}