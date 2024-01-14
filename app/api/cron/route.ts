import Product from "@/lib/models/product.model"
import { connectToDB } from "@/lib/mongoose"
import { generateEmailBody, sendEmail } from "@/lib/nodemailer"
import { scrapeAmazonProduct } from "@/lib/scraper"
import { getAveragePrice, getEmailNotifType, getHighestPrice, getLowestPrice } from "@/lib/utils"
import { connect } from "http2"
import { url } from "inspector"
import { NextResponse } from "next/server"
import { title } from "process"

export async function GET() {
    try {
        connectToDB()

        const products = await Product.find({})

        if (!products) throw new Error("No products found")

        // 1. scrape latest product detail and update DB
        const updateProducts = await Promise.all(
            products.map(async (currentProduct) => {
                const scrapedProduct = await scrapeAmazonProduct(currentProduct.url)

                if (!scrapedProduct) throw new Error("No product found")

                const updatedPriceHistory = [
                    ...currentProduct.priceHistory,
                    { price: scrapedProduct.currentPrice }
                ]

                const product = {
                    ...scrapedProduct,
                    priceHistory: updatedPriceHistory,
                    lowestPrice: getLowestPrice(updatedPriceHistory),
                    highestPrice: getHighestPrice(updatedPriceHistory),
                    averagePrice: getAveragePrice(updatedPriceHistory),
                }


                const updatedProduct = await Product.findOneAndUpdate(
                    { url: scrapedProduct.url },
                    product,
                )

                //2. check each product's status and send email if necessary
                const emailNotifType = getEmailNotifType(scrapedProduct, currentProduct)

                if (emailNotifType && updatedProduct.users.length > 0) {
                    const productInfo = {
                        title: updatedProduct.title,
                        url: updatedProduct.url,
                    }
                    const emailContent = await generateEmailBody(productInfo, emailNotifType)

                    const userEmails = updatedProduct.users.map((user: any) => user.email)

                    await sendEmail(emailContent, userEmails)
                }

                return updatedProduct
            })
        )

            return NextResponse.json({
                message: 'OK', data: updateProducts
            })



    } catch (error) {
        throw new Error(`error in GET: ${error}`)
    }
}