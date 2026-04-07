
import { getFeaturedEvents, getFeaturedProducts, getCurrentLivestream, getLatestPosts } from "@/lib/api";
import HomeClient from "@/components/home/HomeClient";

export const dynamic = 'force-dynamic'; // For now, ensuring fresh data on every request. 
// Later we can switch to revalidate (ISR) for better performance.

export default async function Page() {
  const [
    featuredEvents,
    featuredProducts,
    currentLivestream,
    posts
  ] = await Promise.all([
    getFeaturedEvents(),
    getFeaturedProducts(),
    getCurrentLivestream(),
    getLatestPosts()
  ]);

  return (
    <HomeClient
      initialFeaturedEvents={featuredEvents}
      initialFeaturedProducts={featuredProducts}
      initialLivestream={currentLivestream}
      initialPosts={posts}
    />
  );
}
