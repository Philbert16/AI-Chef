import { useState } from "react"
import CallToAction from "./CallToAction";

function Main() {
    const [addIngredient, setAddIngredient] = useState([])
    const [newIngredient, setNewIngredient] = useState("")
    const [recipe, setRecipe] = useState(null)
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    function addMore(e) {
        e.preventDefault()
        if(newIngredient.trim()){
            setAddIngredient([...addIngredient, newIngredient.trim()])
        }
        setNewIngredient("")
    }

    async function getRecipe() {
        setIsLoading(true)
        setError("")
        setRecipe(null)

        try {
            const response = await fetch("/api/recipe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ingredients: addIngredient }),
            })
            const responseText = await response.text()
            let data = null

            try {
                data = responseText ? JSON.parse(responseText) : null
            } catch {
                throw new Error(
                    `The recipe server returned an invalid response (HTTP ${response.status}). Start the app with "npm run dev" and check that OpenCode is running.`,
                )
            }

            if (!response.ok) {
                throw new Error(data?.error || `Could not generate a recipe (HTTP ${response.status}).`)
            }

            if (
                typeof data?.summary !== "string" ||
                !Array.isArray(data.instructions) ||
                data.instructions.length === 0
            ) {
                throw new Error(
                    'The recipe server returned an empty or incomplete response. Check that OpenCode is running and has a model configured.',
                )
            }

            setRecipe(data)
        } catch (requestError) {
            setError(requestError.message || "Could not generate a recipe. Please try again.")
        } finally {
            setIsLoading(false)
        }
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

                <CallToAction onGetRecipe={getRecipe} disabled={isLoading} />

                {isLoading && <p role="status">Generating your recipe...</p>}
                {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

                {recipe && (
                    <section className="text-left" aria-live="polite">
                        <h1 className="text-xl font-bold">Suggested Recipe</h1>
                        <p className="mt-2 text-gray-700">{recipe.summary}</p>

                        <h1 className="mt-5 text-xl font-bold">Instruction</h1>
                        <ol className="mt-2 list-decimal space-y-2 pl-5">
                            {recipe.instructions.map((step, index) => (
                                <li key={index}>{step}</li>
                            ))}
                        </ol>
                    </section>
                )}
            </>
            }
        </div>
    </main>
  )
}

export default Main