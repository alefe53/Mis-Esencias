import api from './api'

interface CreateOrderPayload {
  tierId: number
  provider: 'mercadopago' | 'paypal'
  durationMonths: number
}

export const createPaymentOrder = async (payload: CreateOrderPayload) => {
  const { data } = await api.post('/payments/create-order', payload)
  return data.data
}

export const capturePayPalOrder = async (orderID: string) => {
  const { data } = await api.post('/payments/capture-paypal-order', { orderID })
  return data.data
}
