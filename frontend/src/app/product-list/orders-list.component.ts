// orders-list.component.ts
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { OrderApiService } from '../forum/services/order-api.service';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { formatDate } from '@angular/common';

interface Order {
  id: number;
  orderDate: string;
  totalPrice: number;
  fullName: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  paymentMethod: string;
  status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
}

interface OrderFilters {
  search: string;
  dateFrom: string;
  dateTo: string;
  minAmount: number | null;
  maxAmount: number | null;
  country: string;
  paymentMethod: string;
  status: string;
}

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './orders-list.component.html',
  styleUrls: ['./orders-list.component.scss']
})
export class OrdersListComponent implements OnInit {
  @ViewChild('ordersTable') ordersTable!: ElementRef;
  
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  selectedOrder: Order | null = null;
  showOrderDetails = false;
  showFilters: boolean = true;
  isLoading = false;
  isLoadingExport = false;
  
  // Filters
  filters: OrderFilters = {
    search: '',
    dateFrom: '',
    dateTo: '',
    minAmount: null,
    maxAmount: null,
    country: 'all',
    paymentMethod: 'all',
    status: 'all'
  };
  
  // Filter options
  countries: string[] = ['all', 'France', 'Belgium', 'Switzerland', 'Luxembourg', 'Germany', 'Italy', 'Spain'];
  paymentMethods: string[] = ['all', 'card', 'paypal', 'bank_transfer', 'cash_on_delivery'];
  statuses: string[] = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  
  // Statistics
  stats = {
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0
  };
  
  // Date range presets
  datePresets = [
    { label: 'Today', days: 0 },
    { label: 'Yesterday', days: 1 },
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'This month', custom: true },
    { label: 'Last month', custom: true },
    { label: 'This year', custom: true }
  ];
  
  constructor(private orderApi: OrderApiService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.orderApi.getAllOrders().subscribe({
      next: (data) => {
        // Add mock status for demonstration (since backend doesn't provide status)
        this.orders = data.map((order: Order) => ({
          ...order,
          status: this.getRandomStatus()
        }));
        this.applyFilters();
        this.calculateStats();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.isLoading = false;
      }
    });
  }

  // Temporary function to generate random status (remove when backend provides status)
  private getRandomStatus(): Order['status'] {
    const statuses: Order['status'][] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  applyFilters(): void {
    let filtered = [...this.orders];

    // Search filter (searches in multiple fields)
    if (this.filters.search.trim()) {
      const searchTerm = this.filters.search.toLowerCase();
      filtered = filtered.filter(order => 
        order.fullName.toLowerCase().includes(searchTerm) ||
        order.email.toLowerCase().includes(searchTerm) ||
        order.id.toString().includes(searchTerm) ||
        order.address.toLowerCase().includes(searchTerm) ||
        order.city.toLowerCase().includes(searchTerm)
      );
    }

    // Date range filter
    if (this.filters.dateFrom) {
      const fromDate = new Date(this.filters.dateFrom);
      filtered = filtered.filter(order => new Date(order.orderDate) >= fromDate);
    }
    if (this.filters.dateTo) {
      const toDate = new Date(this.filters.dateTo);
      toDate.setHours(23, 59, 59);
      filtered = filtered.filter(order => new Date(order.orderDate) <= toDate);
    }

    // Amount range filter
    if (this.filters.minAmount !== null) {
      filtered = filtered.filter(order => order.totalPrice >= this.filters.minAmount!);
    }
    if (this.filters.maxAmount !== null) {
      filtered = filtered.filter(order => order.totalPrice <= this.filters.maxAmount!);
    }

    // Country filter
    if (this.filters.country !== 'all') {
      filtered = filtered.filter(order => order.country === this.filters.country);
    }

    // Payment method filter
    if (this.filters.paymentMethod !== 'all') {
      filtered = filtered.filter(order => order.paymentMethod === this.filters.paymentMethod);
    }

    // Status filter
    if (this.filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === this.filters.status);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

    this.filteredOrders = filtered;
    this.calculateStats();
    this.calculatePagination();
  }

  calculateStats(): void {
    this.stats = {
      totalOrders: this.filteredOrders.length,
      totalRevenue: this.filteredOrders.reduce((sum, order) => sum + order.totalPrice, 0),
      averageOrderValue: this.filteredOrders.length > 0 
        ? this.filteredOrders.reduce((sum, order) => sum + order.totalPrice, 0) / this.filteredOrders.length 
        : 0,
      pendingOrders: this.filteredOrders.filter(o => o.status === 'pending').length,
      processingOrders: this.filteredOrders.filter(o => o.status === 'processing').length,
      shippedOrders: this.filteredOrders.filter(o => o.status === 'shipped').length,
      deliveredOrders: this.filteredOrders.filter(o => o.status === 'delivered').length,
      cancelledOrders: this.filteredOrders.filter(o => o.status === 'cancelled').length
    };
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredOrders.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  get paginatedOrders(): Order[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredOrders.slice(start, end);
  }

  resetFilters(): void {
    this.filters = {
      search: '',
      dateFrom: '',
      dateTo: '',
      minAmount: null,
      maxAmount: null,
      country: 'all',
      paymentMethod: 'all',
      status: 'all'
    };
    this.applyFilters();
  }

  applyDatePreset(preset: any): void {
    const today = new Date();
    let fromDate = new Date();
    let toDate = new Date();

    switch(preset.label) {
      case 'Today':
        fromDate = today;
        toDate = today;
        break;
      case 'Yesterday':
        fromDate.setDate(today.getDate() - 1);
        toDate.setDate(today.getDate() - 1);
        break;
      case 'Last 7 days':
        fromDate.setDate(today.getDate() - 7);
        toDate = today;
        break;
      case 'Last 30 days':
        fromDate.setDate(today.getDate() - 30);
        toDate = today;
        break;
      case 'This month':
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'Last month':
        fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        toDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'This year':
        fromDate = new Date(today.getFullYear(), 0, 1);
        toDate = new Date(today.getFullYear(), 11, 31);
        break;
    }

    this.filters.dateFrom = this.formatDateForInput(fromDate);
    this.filters.dateTo = this.formatDateForInput(toDate);
    this.applyFilters();
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusClass(status: string): string {
    const classes = {
      'pending': 'status-pending',
      'processing': 'status-processing',
      'shipped': 'status-shipped',
      'delivered': 'status-delivered',
      'cancelled': 'status-cancelled'
    };
    return classes[status as keyof typeof classes] || '';
  }

  getStatusIcon(status: string): string {
    const icons = {
      'pending': 'bi-hourglass-split',
      'processing': 'bi-gear',
      'shipped': 'bi-truck',
      'delivered': 'bi-check-circle',
      'cancelled': 'bi-x-circle'
    };
    return icons[status as keyof typeof icons] || 'bi-question-circle';
  }

  viewOrderDetails(order: Order): void {
    this.selectedOrder = order;
    this.showOrderDetails = true;
  }

  closeOrderDetails(): void {
    this.showOrderDetails = false;
    this.selectedOrder = null;
  }

  updateOrderStatus(orderId: number, newStatus: string): void {
    // This would call your API to update status
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      order.status = newStatus as Order['status'];
      this.applyFilters();
    }
  }

  // Export to PDF
  exportToPDF(): void {
    this.isLoadingExport = true;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(33, 33, 33);
    doc.text('Orders Report', pageWidth / 2, 20, { align: 'center' });
    
    // Date range
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    let dateRangeText = 'All time';
    if (this.filters.dateFrom && this.filters.dateTo) {
      dateRangeText = `${this.filters.dateFrom} to ${this.filters.dateTo}`;
    } else if (this.filters.dateFrom) {
      dateRangeText = `From ${this.filters.dateFrom}`;
    } else if (this.filters.dateTo) {
      dateRangeText = `Until ${this.filters.dateTo}`;
    }
    doc.text(`Period: ${dateRangeText}`, pageWidth / 2, 30, { align: 'center' });
    
    // Statistics
    doc.setFontSize(12);
    doc.setTextColor(33, 33, 33);
    doc.text('Statistics', 14, 45);
    
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Total Orders: ${this.stats.totalOrders}`, 14, 55);
    doc.text(`Total Revenue: ${this.stats.totalRevenue.toFixed(2)} €`, 14, 62);
    doc.text(`Average Order: ${this.stats.averageOrderValue.toFixed(2)} €`, 14, 69);
    
    // Status breakdown
    const statusY = 55;
    doc.text(`Pending: ${this.stats.pendingOrders}`, 100, statusY);
    doc.text(`Processing: ${this.stats.processingOrders}`, 100, statusY + 7);
    doc.text(`Shipped: ${this.stats.shippedOrders}`, 100, statusY + 14);
    doc.text(`Delivered: ${this.stats.deliveredOrders}`, 160, statusY);
    doc.text(`Cancelled: ${this.stats.cancelledOrders}`, 160, statusY + 7);
    
    // Orders table
    const tableColumn = ['Order ID', 'Date', 'Customer', 'Email', 'Country', 'Amount', 'Status'];
    const tableRows: any[][] = [];
    
    this.filteredOrders.forEach(order => {
      const orderData = [
        `#${order.id}`,
        this.formatDate(order.orderDate),
        order.fullName,
        order.email,
        order.country,
        `${order.totalPrice.toFixed(2)} €`,
        order.status?.toUpperCase() || 'N/A'
      ];
      tableRows.push(orderData);
    });
    
    autoTable(doc, {
              head: [tableColumn],
      body: tableRows,
      startY: 85,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [51, 51, 51], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
    
    // Footer with generation date
    const today = new Date();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Generated on ${today.toLocaleDateString()} at ${today.toLocaleTimeString()}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
    
    doc.save(`orders_${new Date().toISOString().split('T')[0]}.pdf`);
    this.isLoadingExport = false;
  }

  // Export to Excel
  exportToExcel(): void {
    this.isLoadingExport = true;
    
    const worksheetData = this.filteredOrders.map(order => ({
      'Order ID': order.id,
      'Date': this.formatDate(order.orderDate),
      'Customer Name': order.fullName,
      'Email': order.email,
      'Address': order.address,
      'City': order.city,
      'Postal Code': order.postalCode,
      'Country': order.country,
      'Payment Method': order.paymentMethod,
      'Total Amount': order.totalPrice,
      'Status': order.status?.toUpperCase() || 'N/A'
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
    
    // Adjust column widths
    const maxWidth = 50;
    const wscols = [
      { wch: 8 },  // Order ID
      { wch: 18 }, // Date
      { wch: 25 }, // Customer Name
      { wch: 30 }, // Email
      { wch: 40 }, // Address
      { wch: 15 }, // City
      { wch: 12 }, // Postal Code
      { wch: 15 }, // Country
      { wch: 15 }, // Payment Method
      { wch: 12 }, // Total Amount
      { wch: 12 }  // Status
    ];
    worksheet['!cols'] = wscols;
    
    // Add summary sheet
    const summaryData = [{
      'Metric': 'Total Orders',
      'Value': this.stats.totalOrders
    }, {
      'Metric': 'Total Revenue (€)',
      'Value': this.stats.totalRevenue.toFixed(2)
    }, {
      'Metric': 'Average Order Value (€)',
      'Value': this.stats.averageOrderValue.toFixed(2)
    }, {
      'Metric': 'Pending Orders',
      'Value': this.stats.pendingOrders
    }, {
      'Metric': 'Processing Orders',
      'Value': this.stats.processingOrders
    }, {
      'Metric': 'Shipped Orders',
      'Value': this.stats.shippedOrders
    }, {
      'Metric': 'Delivered Orders',
      'Value': this.stats.deliveredOrders
    }, {
      'Metric': 'Cancelled Orders',
      'Value': this.stats.cancelledOrders
    }];
    
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `orders_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    this.isLoadingExport = false;
  }

  // Helper methods for template
  pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
}