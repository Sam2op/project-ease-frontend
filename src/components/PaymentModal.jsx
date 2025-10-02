import React, { useState, useEffect } from 'react'
import { X, CreditCard, Smartphone, Clock, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'react-toastify'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'

const PaymentModal = ({ isOpen, onClose, request, paymentType, onPaymentSuccess }) => {
  const [step, setStep] = useState('select') // select, processing, success, failed
  const [loading, setLoading] = useState(false)

  const paymentAmounts = {
    advance: request?.totalAmount ? Math.round(request.totalAmount * 0.7) : 0,
    full: request?.totalAmount || 0,
    remaining: getRemainingAmount()
  }

  function getRemainingAmount() {
    if (!request?.payments) return request?.totalAmount || 0
    const totalPaid = request.payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0)
    return (request?.totalAmount || 0) - totalPaid
  }

  const initiateRazorpayPayment = async () => {
    setLoading(true)
    
    try {
      console.log('Creating Razorpay order...')
      
      // Create Razorpay order
      const { data } = await axios.post('/payments/create-order', {
        requestId: request._id,
        paymentType
      })

      if (data.success) {
        console.log('Razorpay order created:', data.orderId)
        
        // Configure Razorpay options
        const options = {
          key: data.key,
          amount: data.amount * 100, // Amount in paise
          currency: data.currency,
          name: 'ProjectEase',
          description: `Payment for ${data.projectName}`,
          order_id: data.orderId,
          handler: async function (response) {
            console.log('Payment successful:', response)
            await verifyPayment(response, data.paymentId)
          },
          modal: {
            ondismiss: function() {
              setLoading(false)
              console.log('Payment modal dismissed')
            }
          },
          prefill: {
            name: data.userName,
            email: request.user?.email || '',
            contact: request.user?.contactNumber || ''
          },
          theme: {
            color: '#0ea5e9'
          },
          method: {
            upi: true,
            card: true,
            netbanking: true,
            wallet: true
          }
        }

        // Open Razorpay checkout
        const rzp = new window.Razorpay(options)
        
        rzp.on('payment.failed', function (response) {
          console.error('Payment failed:', response.error)
          setStep('failed')
          setLoading(false)
          toast.error('Payment failed: ' + response.error.description)
        })

        rzp.open()
        setStep('processing')
        
      } else {
        throw new Error(data.message || 'Failed to create order')
      }
      
    } catch (error) {
      console.error('Payment initiation error:', error)
      toast.error(error.response?.data?.message || 'Failed to initiate payment')
      setLoading(false)
    }
  }

  const verifyPayment = async (razorpayResponse, paymentId) => {
    try {
      console.log('Verifying payment...')
      
      const { data } = await axios.post('/payments/verify', {
        razorpay_order_id: razorpayResponse.razorpay_order_id,
        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
        razorpay_signature: razorpayResponse.razorpay_signature
      })

      if (data.success) {
        console.log('Payment verified successfully')
        setStep('success')
        toast.success('Payment successful!')
        
        // Start polling for real-time status updates
        startStatusPolling(paymentId)
        
        setTimeout(() => {
          onPaymentSuccess && onPaymentSuccess()
          onClose()
        }, 2000)
        
      } else {
        throw new Error(data.message || 'Payment verification failed')
      }
      
    } catch (error) {
      console.error('Payment verification error:', error)
      setStep('failed')
      toast.error(error.response?.data?.message || 'Payment verification failed')
    } finally {
      setLoading(false)
    }
  }

  const startStatusPolling = (paymentId) => {
    const pollInterval = setInterval(async () => {
      try {
        const { data } = await axios.get(`/payments/status/${paymentId}`)
        
        if (data.success && data.payment.status === 'completed') {
          clearInterval(pollInterval)
          console.log('Payment status confirmed via polling')
        }
      } catch (error) {
        console.error('Status polling error:', error)
      }
    }, 3000) // Poll every 3 seconds

    // Stop polling after 30 seconds
    setTimeout(() => {
      clearInterval(pollInterval)
    }, 30000)
  }

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.onload = () => resolve(true)
        script.onerror = () => resolve(false)
        document.body.appendChild(script)
      })
    }

    if (isOpen && !window.Razorpay) {
      loadRazorpayScript().then((loaded) => {
        if (!loaded) {
          toast.error('Failed to load payment gateway')
        }
      })
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              Payment - ₹{paymentAmounts[paymentType]?.toLocaleString()}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-600 mt-1">
            {paymentType === 'advance' ? '70% Advance Payment' : 
             paymentType === 'remaining' ? 'Remaining Payment' : 'Full Payment'}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Payment Selection */}
            {step === 'select' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Secure Payment</h3>
                  <p className="text-gray-600">
                    Pay securely using UPI, Cards, or Net Banking
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Amount</span>
                      <span className="font-semibold">₹{paymentAmounts[paymentType]?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Payment Type</span>
                      <span className="font-semibold capitalize">{paymentType}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Project</span>
                      <span className="font-semibold text-sm">{request?.project?.name || request?.customProject?.name || 'Custom Project'}</span>
                    </div>
                  </div>

                  <button
                    onClick={initiateRazorpayPayment}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Pay Securely
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                    <Smartphone className="w-4 h-4" />
                    <span>UPI</span>
                    <span>•</span>
                    <CreditCard className="w-4 h-4" />
                    <span>Cards</span>
                    <span>•</span>
                    <span>Net Banking</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Processing */}
            {step === 'processing' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Processing Payment...
                </h3>
                <p className="text-gray-600 mb-4">
                  Please complete the payment in the popup window
                </p>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </motion.div>
            )}

            {/* Step 3: Success */}
            {step === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Payment Successful!
                </h3>
                <p className="text-gray-600 mb-6">
                  Your payment of ₹{paymentAmounts[paymentType]?.toLocaleString()} has been confirmed.
                </p>
                <button
                  onClick={onClose}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700"
                >
                  Continue
                </button>
              </motion.div>
            )}

            {/* Step 4: Failed */}
            {step === 'failed' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Payment Failed
                </h3>
                <p className="text-gray-600 mb-6">
                  Your payment could not be processed. Please try again.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => setStep('select')}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

export default PaymentModal
