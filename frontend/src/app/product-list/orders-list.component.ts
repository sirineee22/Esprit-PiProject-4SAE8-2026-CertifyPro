// orders-list.component.ts
// ULTRA PREMIUM ADVANCED VERSION
// Better UX / Better Filters / Better Analytics / Better Performance

import {
  Component,
  OnInit,
  ViewChild,
  ElementRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { OrderApiService } from '../forum/services/order-api.service';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/////////////////////////////////////////////////////////////

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

  status?:
    | 'pending'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled';
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

/////////////////////////////////////////////////////////////

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './orders-list.component.html',
  styleUrls: ['./orders-list.component.scss']
})
export class OrdersListComponent implements OnInit {

  ///////////////////////////////////////////////////////////
  // VIEWCHILD
  ///////////////////////////////////////////////////////////

  @ViewChild('ordersTable')
  ordersTable!: ElementRef;

  ///////////////////////////////////////////////////////////
  // DATA
  ///////////////////////////////////////////////////////////

  orders: Order[] = [];
  filteredOrders: Order[] = [];

  selectedOrder: Order | null = null;

  ///////////////////////////////////////////////////////////
  // UI STATES
  ///////////////////////////////////////////////////////////

  showOrderDetails = false;
  showFilters = true;

  isLoading = false;
  isLoadingExport = false;

  darkMode = false;

  ///////////////////////////////////////////////////////////
  // FILTERS
  ///////////////////////////////////////////////////////////

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

  ///////////////////////////////////////////////////////////
  // OPTIONS
  ///////////////////////////////////////////////////////////

  countries = [
    'all',
    'Tunisia',
    'France',
    'Belgium',
    'Germany',
    'Italy',
    'Spain',
    'Switzerland',
    'Luxembourg'
  ];

  paymentMethods = [
    'all',
    'card',
    'paypal',
    'cash',
    'bank_transfer'
  ];

  statuses = [
    'all',
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled'
  ];

  ///////////////////////////////////////////////////////////
  // PAGINATION
  ///////////////////////////////////////////////////////////

  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  ///////////////////////////////////////////////////////////
  // STATS
  ///////////////////////////////////////////////////////////

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

  ///////////////////////////////////////////////////////////
  // DATE PRESETS
  ///////////////////////////////////////////////////////////

  datePresets = [

    { label: 'Today', days: 0 },
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'This month', custom: true },
    { label: 'Last month', custom: true },
    { label: 'This year', custom: true }
  ];

  ///////////////////////////////////////////////////////////

  constructor(
    private orderApi: OrderApiService
  ) {}

  ///////////////////////////////////////////////////////////
  // INIT
  ///////////////////////////////////////////////////////////

  ngOnInit(): void {

    this.restoreDarkMode();
    this.loadOrders();
  }

  ///////////////////////////////////////////////////////////
  // LOAD
  ///////////////////////////////////////////////////////////

  loadOrders(): void {

    this.isLoading = true;

    this.orderApi.getAllOrders()
      .subscribe({

        next: (data) => {

          this.orders = data.map((o: Order) => ({
            ...o,
            status:
              o.status ||
              this.smartStatus(o)
          }));

          this.applyFilters();

          this.isLoading = false;
        },

        error: () => {

          this.isLoading = false;
        }
      });
  }

  ///////////////////////////////////////////////////////////
  // SMART STATUS
  ///////////////////////////////////////////////////////////

  smartStatus(order: Order): Order['status'] {

    const age =
      (Date.now() -
      new Date(order.orderDate).getTime())
      / 86400000;

    if (age < 1) return 'pending';
    if (age < 2) return 'processing';
    if (age < 4) return 'shipped';
    return 'delivered';
  }

  ///////////////////////////////////////////////////////////
  // FILTERS
  ///////////////////////////////////////////////////////////

  applyFilters(): void {

    let list = [...this.orders];

    ///////////////////////////////////////////
    // SEARCH
    ///////////////////////////////////////////

    if (this.filters.search.trim()) {

      const term =
        this.filters.search
          .toLowerCase();

      list = list.filter(o =>

        (o.fullName || '')
          .toLowerCase()
          .includes(term)

        || (o.email || '')
          .toLowerCase()
          .includes(term)

        || (o.id + '')
          .includes(term)

        || (o.city || '')
          .toLowerCase()
          .includes(term)
      );
    }

    ///////////////////////////////////////////
    // DATES
    ///////////////////////////////////////////

    if (this.filters.dateFrom) {

      const from =
        new Date(this.filters.dateFrom);

      list = list.filter(
        o =>
          new Date(o.orderDate) >= from
      );
    }

    if (this.filters.dateTo) {

      const to =
        new Date(this.filters.dateTo);

      to.setHours(23, 59, 59);

      list = list.filter(
        o =>
          new Date(o.orderDate) <= to
      );
    }

    ///////////////////////////////////////////
    // AMOUNT
    ///////////////////////////////////////////

    if (this.filters.minAmount !== null) {

      list = list.filter(
        o =>
          o.totalPrice >=
          this.filters.minAmount!
      );
    }

    if (this.filters.maxAmount !== null) {

      list = list.filter(
        o =>
          o.totalPrice <=
          this.filters.maxAmount!
      );
    }

    ///////////////////////////////////////////
    // COUNTRY
    ///////////////////////////////////////////

    if (this.filters.country !== 'all') {

      list = list.filter(
        o =>
          o.country ===
          this.filters.country
      );
    }

    ///////////////////////////////////////////
    // PAYMENT
    ///////////////////////////////////////////

    if (
      this.filters.paymentMethod !==
      'all'
    ) {

      list = list.filter(
        o =>
          o.paymentMethod ===
          this.filters.paymentMethod
      );
    }

    ///////////////////////////////////////////
    // STATUS
    ///////////////////////////////////////////

    if (this.filters.status !== 'all') {

      list = list.filter(
        o =>
          o.status ===
          this.filters.status
      );
    }

    ///////////////////////////////////////////
    // SORT
    ///////////////////////////////////////////

    list.sort(
      (a, b) =>
        new Date(b.orderDate).getTime()
        -
        new Date(a.orderDate).getTime()
    );

    this.filteredOrders = list;

    this.calculateStats();
    this.calculatePagination();
  }

  ///////////////////////////////////////////////////////////
  // STATS
  ///////////////////////////////////////////////////////////

  calculateStats(): void {

    const revenue =
      this.filteredOrders.reduce(
        (sum, x) =>
          sum + x.totalPrice,
        0
      );

    this.stats = {

      totalOrders:
        this.filteredOrders.length,

      totalRevenue:
        revenue,

      averageOrderValue:
        this.filteredOrders.length
          ? revenue /
            this.filteredOrders.length
          : 0,

      pendingOrders:
        this.countStatus('pending'),

      processingOrders:
        this.countStatus('processing'),

      shippedOrders:
        this.countStatus('shipped'),

      deliveredOrders:
        this.countStatus('delivered'),

      cancelledOrders:
        this.countStatus('cancelled')
    };
  }

  countStatus(status: string): number {

    return this.filteredOrders.filter(
      x => x.status === status
    ).length;
  }

  ///////////////////////////////////////////////////////////
  // PAGINATION
  ///////////////////////////////////////////////////////////

  calculatePagination(): void {

    this.totalPages =
      Math.ceil(
        this.filteredOrders.length /
        this.itemsPerPage
      ) || 1;

    if (
      this.currentPage >
      this.totalPages
    ) {
      this.currentPage = 1;
    }
  }

  get paginatedOrders(): Order[] {

    const start =
      (this.currentPage - 1) *
      this.itemsPerPage;

    return this.filteredOrders.slice(
      start,
      start + this.itemsPerPage
    );
  }

  pageNumbers(): number[] {

    return Array.from(
      { length: this.totalPages },
      (_, i) => i + 1
    );
  }

  changePage(page: number): void {

    if (
      page < 1 ||
      page > this.totalPages
    ) return;

    this.currentPage = page;
  }

  ///////////////////////////////////////////////////////////
  // DETAILS
  ///////////////////////////////////////////////////////////

  viewOrderDetails(order: Order): void {

    this.selectedOrder = order;
    this.showOrderDetails = true;
  }

  closeOrderDetails(): void {

    this.selectedOrder = null;
    this.showOrderDetails = false;
  }

  ///////////////////////////////////////////////////////////
  // STATUS UPDATE
  ///////////////////////////////////////////////////////////

  updateOrderStatus(
    id: number,
    status: string
  ): void {

    const order =
      this.orders.find(
        x => x.id === id
      );

    if (!order) return;

    order.status =
      status as Order['status'];

    this.applyFilters();
  }

  ///////////////////////////////////////////////////////////
  // RESET
  ///////////////////////////////////////////////////////////

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

  ///////////////////////////////////////////////////////////
  // DATE PRESETS
  ///////////////////////////////////////////////////////////

  applyDatePreset(preset: any): void {

    const now = new Date();

    let from = new Date();
    let to = new Date();

    switch (preset.label) {

      case 'Today':
        break;

      case 'Last 7 days':
        from.setDate(
          now.getDate() - 7
        );
        break;

      case 'Last 30 days':
        from.setDate(
          now.getDate() - 30
        );
        break;

      case 'This month':
        from =
          new Date(
            now.getFullYear(),
            now.getMonth(),
            1
          );

        to =
          new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0
          );
        break;

      case 'Last month':
        from =
          new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            1
          );

        to =
          new Date(
            now.getFullYear(),
            now.getMonth(),
            0
          );
        break;

      case 'This year':
        from =
          new Date(
            now.getFullYear(),
            0,
            1
          );

        to =
          new Date(
            now.getFullYear(),
            11,
            31
          );
        break;
    }

    this.filters.dateFrom =
      this.inputDate(from);

    this.filters.dateTo =
      this.inputDate(to);

    this.applyFilters();
  }

  inputDate(d: Date): string {

    return d.toISOString()
      .split('T')[0];
  }

  ///////////////////////////////////////////////////////////
  // FORMATTERS
  ///////////////////////////////////////////////////////////

  formatDate(value: string): string {

    return new Date(value)
      .toLocaleString('fr-FR');
  }

  getStatusClass(status: string): string {

    return 'status-' + status;
  }

  getStatusIcon(status: string): string {

    const map: any = {

      pending: 'bi-hourglass',
      processing: 'bi-gear',
      shipped: 'bi-truck',
      delivered: 'bi-check-circle',
      cancelled: 'bi-x-circle'
    };

    return map[status]
      || 'bi-circle';
  }

  ///////////////////////////////////////////////////////////
  // DARK MODE
  ///////////////////////////////////////////////////////////

  toggleDarkMode(): void {

    this.darkMode =
      !this.darkMode;

    localStorage.setItem(
      'orders_dark',
      this.darkMode + ''
    );
  }

  restoreDarkMode(): void {

    this.darkMode =
      localStorage.getItem(
        'orders_dark'
      ) === 'true';
  }

  ///////////////////////////////////////////////////////////
  // EXPORT PDF
  ///////////////////////////////////////////////////////////

  exportToPDF(): void {

    this.isLoadingExport = true;

    const doc =
      new jsPDF();

    doc.setFontSize(18);

    doc.text(
      'Orders Report',
      14,
      18
    );

    autoTable(doc, {

      head: [[
        'ID',
        'Customer',
        'Country',
        'Amount',
        'Payment',
        'Status'
      ]],

      body: this.filteredOrders.map(o => [
        '#' + o.id,
        o.fullName || '-',
        o.country || '-',
        (o.totalPrice ?? 0).toFixed(2) + ' €',
        o.paymentMethod || '-',
        o.status || '-'
      ])
    });

    doc.save(
      'orders-report.pdf'
    );

    this.isLoadingExport = false;
  }

  ///////////////////////////////////////////////////////////
  // EXPORT EXCEL
  ///////////////////////////////////////////////////////////

  exportToExcel(): void {

    this.isLoadingExport = true;

    const sheet =
      XLSX.utils.json_to_sheet(
        this.filteredOrders
      );

    const book =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      book,
      sheet,
      'Orders'
    );

    const buffer =
      XLSX.write(book, {
        bookType: 'xlsx',
        type: 'array'
      });

    saveAs(
      new Blob([buffer]),
      'orders.xlsx'
    );

    this.isLoadingExport = false;
  }
}