import { create } from 'zustand'
import type { CardState } from '../types'

export const useCardStore = create<CardState>((set) => ({
  track: null,
  template: 'particle',
  message: '',
  senderName: '',
  recipientName: '',
  coverTitle: '',
  palette: null,
  step: 0,

  setTrack: (track) => set({ track }),
  setTemplate: (template) => set({ template }),
  setMessage: (message) => set({ message }),
  setSenderName: (senderName) => set({ senderName }),
  setRecipientName: (recipientName) => set({ recipientName }),
  setCoverTitle: (coverTitle) => set({ coverTitle }),
  setPalette: (palette) => set({ palette }),
  setStep: (step) => set({ step }),
  reset: () =>
    set({
      track: null,
      template: 'particle',
      message: '',
      senderName: '',
      recipientName: '',
      coverTitle: '',
      palette: null,
      step: 0,
    }),
}))
