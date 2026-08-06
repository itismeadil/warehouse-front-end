import { accountantApi } from "./accountantClient";

export const getAccountantTasks = () =>
  accountantApi.get("/tasks").then((res) => res.data);

export const runAccountantTask = (taskKey, payload) =>
  accountantApi.post(`/run/${taskKey}`, payload).then((res) => res.data);

export const getAccountingReports = (params) =>
  accountantApi.get("/reports", { params }).then((res) => res.data);

export const getAccountingReportById = (id) =>
  accountantApi.get(`/reports/${id}`).then((res) => res.data);

export const clearAccountingReports = () =>
  accountantApi.delete("/reports").then((res) => res.data);

// Purchase invoices — stock coming in from a supplier at a cost.
export const getPurchaseInvoices = () =>
  accountantApi.get("/purchase-invoices").then((res) => res.data);

export const createPurchaseInvoice = (payload) =>
  accountantApi.post("/purchase-invoices", payload).then((res) => res.data);

// Sales invoices — stock going out to a customer at a price. Recording a
// single-item sale is just creating one of these with one line.
export const getSalesInvoices = () =>
  accountantApi.get("/sales-invoices").then((res) => res.data);

export const createSalesInvoice = (payload) =>
  accountantApi.post("/sales-invoices", payload).then((res) => res.data);

// Reservations — stock held for a customer, no money changed hands yet.
export const getReservations = (params) =>
  accountantApi.get("/reservations", { params }).then((res) => res.data);

export const createReservation = (payload) =>
  accountantApi.post("/reservations", payload).then((res) => res.data);

export const cancelReservation = (id, reason) =>
  accountantApi
    .post(`/reservations/${id}/cancel`, { reason })
    .then((res) => res.data);

export const fulfillReservation = (id) =>
  accountantApi.post(`/reservations/${id}/fulfill`).then((res) => res.data);
