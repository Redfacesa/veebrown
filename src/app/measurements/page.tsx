'use client';

import { useState } from 'react';
import { Upload, Ruler, Sparkles } from 'lucide-react';

export default function MeasurementsPage() {
  const [step, setStep] = useState(0);
  const photos = ['Front', 'Side', 'Back'];

  return (
    <div className="pt-24 pb-16">
      <div className="section-padding max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-vbrown-gold text-sm uppercase tracking-wider">Phase 3 · AI Measurements</span>
          <h1 className="font-display text-4xl mt-2 mb-4">AI Body Measurements</h1>
          <p className="text-white/50">
            Upload three photos and our AI estimates your measurements with a confidence score.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {photos.map((label, i) => (
            <label
              key={label}
              className={`glass rounded-xl p-8 text-center cursor-pointer border-2 transition-colors ${
                step === i ? 'border-vbrown-gold' : 'border-transparent hover:border-white/20'
              }`}
              onClick={() => setStep(i)}
            >
              <input type="file" accept="image/*" className="hidden" />
              <Upload size={32} className="mx-auto mb-3 text-white/30" />
              <p className="font-medium">{label}</p>
              <p className="text-xs text-white/40 mt-1">Photo {i + 1}</p>
            </label>
          ))}
        </div>

        <button type="button" className="btn-primary w-full mb-8">
          <Sparkles size={18} />
          Estimate Measurements
        </button>

        <div className="glass rounded-2xl p-8">
          <h2 className="font-semibold mb-6 flex items-center gap-2">
            <Ruler size={20} className="text-vbrown-gold" />
            Estimated Measurements
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {['Chest', 'Shoulders', 'Waist', 'Neck', 'Sleeve', 'Leg', 'Height', 'Size'].map((m) => (
              <div key={m} className="text-center p-4 rounded-xl bg-white/5">
                <p className="text-xs text-white/40 mb-1">{m}</p>
                <p className="text-lg font-semibold text-white/30">—</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/30 text-center mt-6">
            Upload photos to get AI-powered size recommendations. Confidence score shown for transparency.
          </p>
        </div>
      </div>
    </div>
  );
}
