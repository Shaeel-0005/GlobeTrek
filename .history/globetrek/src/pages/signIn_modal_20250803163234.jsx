'use client'

import { useState } from 'react'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function SignIn() {
  const [open, setOpen] = useState(true)

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-500 transition text-white"
      >
        Sign In
      </button>
      <Dialog open={open} onClose={setOpen} className="relative z-10">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
        />

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
