"use client";
import { useState } from "react";
import { PageTransition } from "@/components/shared/PageTransition";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

const StarRating = ({ rating, onChange, label }: { rating: number, onChange: (r: number) => void, label: string }) => {
  return (
    <div className="mb-4 text-left w-full mx-auto">
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <div className="flex gap-2 justify-between">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${
              star <= rating ? "bg-amber-100 text-amber-500 scale-110 shadow-md" : "bg-slate-100 text-slate-300 hover:bg-slate-200"
            }`}
          >
            <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
};

export default function ThankYouPage() {
  const [foodRating, setFoodRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [ambienceRating, setAmbienceRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (foodRating === 0) {
      setError("Please rate the food before submitting.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await api.submitFeedback({
        food_rating: foodRating,
        service_rating: serviceRating || undefined,
        ambience_rating: ambienceRating || undefined,
        comment,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-emerald-50">
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-emerald-200"
          >
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-slate-900 mb-4"
          >
            Thank You!
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-600 mb-12"
          >
            Your feedback helps us serve you better.
          </motion.p>
          <p className="text-slate-400 text-sm font-medium mt-auto">Powered by ShamBit Dine</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center p-6 bg-slate-50 overflow-y-auto pt-12 pb-24">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">How was it?</h1>
        <p className="text-slate-600 mb-8 text-center">We'd love to hear about your experience.</p>

        <div className="w-full max-w-sm space-y-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <StarRating label="Food Rating (Required)" rating={foodRating} onChange={setFoodRating} />
          <StarRating label="Service" rating={serviceRating} onChange={setServiceRating} />
          <StarRating label="Ambience" rating={ambienceRating} onChange={setAmbienceRating} />
          
          <div className="w-full">
            <label className="block text-sm font-medium text-slate-700 mb-2">Any comments?</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us what you loved..."
              className="w-full rounded-2xl border-slate-200 bg-slate-50 p-4 text-slate-700 focus:ring-emerald-500 focus:border-emerald-500 resize-none h-32 outline-none border"
            />
          </div>
          {error && <p className="text-red-500 text-sm font-medium text-center">{error}</p>}
        </div>

        <div className="w-full max-w-sm mt-8">
          <button
            onClick={handleSubmit}
            disabled={submitting || foodRating === 0}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-full shadow-lg shadow-slate-200 disabled:opacity-50 transition-all hover:bg-slate-800 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : "Submit Feedback"}
          </button>
        </div>
        <p className="text-slate-400 text-sm font-medium mt-12 mb-4">Powered by ShamBit Dine</p>
      </div>
    </PageTransition>
  );
}
