import React, { useState } from 'react'
import { X, Calendar, DollarSign, Clock, User, CreditCard, QrCode } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import PaymentModal from './PaymentModal'
import PaymentStatus from './PaymentStatus'

const ProjectDetailsModal = ({ open, onClose, request }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentType, setPaymentType] = useState('advance')

  const handlePayment = (type) => {
    setPaymentType(type)
    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false)
    // Refresh the request data if needed
    window.location.reload() // Simple refresh, you can implement better state management
  }

  const getRemainingAmount = () => {
    if (!request?.payments) return request?.totalAmount || 0
    const totalPaid = request.payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0)
    return (request?.totalAmount || 0) - totalPaid
  }

  if (!open || !request) return null

  const totalAmount = request.totalAmount || request.actualPrice || request.estimatedPrice || 0
  const advanceAmount = Math.round(totalAmount * 0.7)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {request.project?.name || request.customProject?.name || 'Project Details'}
              </h2>
              <p className="text-gray-600 mt-1">CodeSalah Project Details</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Project Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Requested</p>
                  <p className="font-semibold">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Price</p>
                  <p className="font-semibold">₹{totalAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-flex px-2 py-1 rounded-full text-sm font-medium ${
                    request.status === 'approved' ? 'bg-green-100 text-green-700' :
                    request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    request.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    request.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Payment Status</p>
                  <span className={`inline-flex px-2 py-1 rounded-full text-sm font-medium ${
                    request.paymentStatus === 'completed' ? 'bg-green-100 text-green-700' :
                    request.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {request.paymentStatus === 'completed' ? 'Fully Paid' :
                     request.paymentStatus === 'partial' ? 'Partially Paid' :
                     'Pending'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600">
              {request.project?.description || request.customProject?.description || 'Project development'}
            </p>
          </div>

          {/* Custom Requirements */}
          {(request.requirements || request.customProject?.additionalRequirements) && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Custom Requirements</h3>
              <p className="text-gray-600">
                {request.requirements || request.customProject?.additionalRequirements}
              </p>
            </div>
          )}

          {/* Payment Status Component */}
          {request.status === 'approved' && totalAmount > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Payment Information</h3>
              <PaymentStatus request={request} />
            </div>
          )}

          {/* Payment Buttons */}
          {(request.status === 'approved' || request.status === 'in-progress' || request.status === 'completed') && totalAmount > 0 && request.paymentStatus !== 'completed' && (
            <div className="border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Make Payment</h3>
              </div>
              
              {request.paymentStatus === 'pending' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => handlePayment('advance')}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <QrCode className="w-5 h-5" />
                    Pay 70% Advance
                    <span className="font-semibold">₹{advanceAmount.toLocaleString()}</span>
                  </button>
                  <button
                    onClick={() => handlePayment('full')}
                    className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <QrCode className="w-5 h-5" />
                    Pay Full Amount
                    <span className="font-semibold">₹{totalAmount.toLocaleString()}</span>
                  </button>
                </div>
              )}
              
              {request.paymentStatus === 'partial' && (
                <button
                  onClick={() => handlePayment('remaining')}
                  className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <QrCode className="w-5 h-5" />
                  Pay Remaining Amount
                  <span className="font-semibold">₹{getRemainingAmount().toLocaleString()}</span>
                </button>
              )}
            </div>
          )}

          {/* Status History */}
          {request.statusHistory && request.statusHistory.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Status History</h3>
              <div className="space-y-2">
                {request.statusHistory.map((history, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium capitalize">{history.status}</p>
                      {history.notes && (
                        <p className="text-sm text-gray-600">{history.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {new Date(history.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        request={request}
        paymentType={paymentType}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  )
}

export default ProjectDetailsModal
