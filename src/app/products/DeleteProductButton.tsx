"use client"

import { useState } from "react"
import { Trash2, Loader2 } from "lucide-react"
import { deleteProduct } from "./actions"

export default function DeleteProductButton({ id }: { id: string }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) return
    
    setIsDeleting(true)
    const res = await deleteProduct(id)
    
    if (res.error) {
      alert("Error: " + res.error)
      setIsDeleting(false)
    }
    // No need to redirect, revalidatePath will refresh the server component
  }

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
    >
      {isDeleting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </button>
  )
}
