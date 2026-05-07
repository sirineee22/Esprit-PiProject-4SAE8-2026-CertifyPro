export interface OrderLineDTO {
    productId: number;
    quantity: number;
  }
  
  /* Payload sent to backend */
  export interface OrderDTO {
  
    fullName: string;
    email: string;
  
    address: string;
    city: string;
    postalCode: string;
    country: string;
  
    paymentMethod: string;
  
    lines: OrderLineDTO[];
  }
  
  
  /* Response from backend */
  
  export interface OrderLineResponse {
    id: number;
    quantity: number;
    price: number;
    product: any; // or Product model
  }
  
  export interface OrderResponse {
  
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
  
    orderLines: OrderLineResponse[];
  }