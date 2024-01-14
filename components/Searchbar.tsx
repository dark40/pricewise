"use client"

import { scrapeAndStoreProduct } from "@/lib/actions"
import { FormEvent, useState } from "react"

const isValidAmazonProductUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url)
    const hostname = parsedUrl.hostname

    // check if hostname is amazon
    if (hostname.includes('amazon.com') ||
      hostname.includes('amazon.') ||
      hostname.endsWith('amazon')) {
      return true
    }

  } catch (error) {
    return false
  }
  return false
}

const Searchbar = () => {
  const [searchPrompt, setSearchPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)


  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const isValidLink = isValidAmazonProductUrl(searchPrompt)

    if(!isValidLink) return alert('Please provide a valid Amazon product link')

    try {
      setIsLoading(true)

      // Scrape the product page
      const product = await scrapeAndStoreProduct(searchPrompt)
    } catch (error) {
      
    } finally {
      setIsLoading(false)
    }

  }

  return (
    <form
      className='flex flex-wrap gap-4 mt-12'
      onSubmit={handleSubmit}>

      <input
        type="text"
        value={searchPrompt}
        onChange={(e) => setSearchPrompt(e.target.value)}
        placeholder="Enter product link"
        className="searchbar-input"
      />

      <button
        className="searchbar-btn"
        type="submit"
        disabled={searchPrompt === ''}
        >
        {isLoading? 'Searching...' : 'Search'}

      </button>

    </form>
  )
}

export default Searchbar