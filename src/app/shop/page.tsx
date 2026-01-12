export default function ShopPage() {
    return (
        <div className="container mx-auto px-4 py-20 text-center">
            <h1 className="text-4xl font-heading uppercase tracking-wide mb-4 text-white">Shop</h1>
            <p className="text-xl text-gray-400">Our new shop experience is coming soon.</p>
            <a
                href="https://www.etsy.com/shop/SavageGentlemen"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-8 btn-modern gradient-primary text-white px-8 py-4 uppercase tracking-widest font-bold rounded"
            >
                Visit Etsy Store
            </a>
        </div>
    );
}
