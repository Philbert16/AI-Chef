import { useState } from "react"
import CallToAction from "./CallToAction";

function Main() {
    const [addIngredient, setAddIngredient] = useState([])
    const [newIngredient, setNewIngredient] = useState("")

    function addMore(e) {
        e.preventDefault()
        if(newIngredient.trim()){
            setAddIngredient([...addIngredient, newIngredient])
        }
        setNewIngredient("")
    }

  return (     
    <main className="pt-8 flex justify-center flex-col items-center">
        <div className="w-full max-w-md flex flex-col gap-6 px-4">
            
            {/* Input Section */}
            <form onSubmit={addMore} className="flex gap-3">
                <input 
                    type="text" 
                    placeholder="e.g avocado" 
                    value={newIngredient}
                    onChange={(e) => setNewIngredient(e.target.value)}
                    className="flex-1 px-4 py-2 bg-white rounded-md border border-gray-200 shadow-sm outline-none"
                />
                <button 
                    className="bg-black text-white py-2 px-4 rounded-md cursor-pointer text-sm hover:bg-gray-800 whitespace-nowrap"
                    type="submit"
                >
                    + Add Ingredient
                </button>
            </form>   

            {/* Ingredients List Section */}
            {addIngredient.length > 0 &&
            <>
                <div className="text-left">
                    <h2 className="font-bold mb-2">Ingredients on hand:</h2>
                    <ul className="list-disc pl-5 space-y-1">
                        {addIngredient.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
                </div>

                <CallToAction />
            </>
            }
        </div>
    </main>
  )
}

export default Main