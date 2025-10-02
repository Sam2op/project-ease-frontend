import React from 'react'
import { CheckCircle, Clock, XCircle, CreditCard } from 'lucide-react'

const PaymentStatus = ({ request }) => {
  if (!request) return null

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'partial':
        return <Clock className="w-5 h-5 text-orange-600" />
      case 'pending':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <CreditCard className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Fully Paid'
      case 'partial':
        return 'Partially Paid'
      case 'pending':
        return 'Payment Pending'
      default:
        return 'Unknown'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50'
      case 'partial':
        return 'text-orange-600 bg-orange-50'
      case 'pending':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const completedPayments = request.payments?.filter(p => p.status === 'completed') || []
  const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center gap-2 mb-3">
        {getStatusIcon(request.paymentStatus)}
        <span className={`px-2 py-1 rounded-full text-sm font-semibold ${getStatusColor(request.paymentStatus)}`}>
          {getStatusText(request.paymentStatus)}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Total Amount:</span>
          <span className="font-semibold">₹{request.totalAmount?.toLocaleString()}</span>
        </div>
        
        {totalPaid > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">Paid:</span>
            <span className="font-semibold text-green-600">₹{totalPaid.toLocaleString()}</span>
          </div>
        )}

        {request.paymentStatus === 'partial' && (
          <div className="flex justify-between">
            <span className="text-gray-600">Remaining:</span>
            <span className="font-semibold text-orange-600">
              ₹{(request.totalAmount - totalPaid).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Payment History */}
      {completedPayments.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2">Payment History:</p>
          <div className="space-y-1">
            {completedPayments.map((payment, index) => (
              <div key={index} className="flex justify-between text-xs text-gray-600">
                <span>{payment.type?.toUpperCase()} - {new Date(payment.paidAt).toLocaleDateString()}</span>
                <span>₹{payment.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentStatus
