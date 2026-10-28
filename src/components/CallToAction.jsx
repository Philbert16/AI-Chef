

function CallToAction() {
  return (
    <div className="flex w-full items-center justify-between gap-4 rounded-md bg-gray-100 p-4">
      <div>
        <h1 className="font-bold">Ready for a recipe?</h1>
        <p className="mt-2 text-sm text-gray-600">
          Generate a recipe from your list of ingredients.
        </p>
      </div>
      <div>
        <button className="whitespace-nowrap rounded-md bg-orange-700 px-3 py-2 text-sm text-white hover:bg-orange-600 cursor-pointer">
          Get a recipe
        </button>
      </div>
    </div>
  );
}

export default CallToAction;
