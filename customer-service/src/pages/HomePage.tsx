import Hero from '../components/Hero.tsx'
import PrintOnDemandBanner from '../components/PrintOnDemandBanner.tsx'
import BestSellers from '../components/BestSellers.tsx'
import Categories from '../components/Categories.tsx'
import MaterialExplorer from '../components/MaterialExplorer.tsx'
import HowItWorks from '../components/HowItWorks.tsx'

export default function HomePage() {
  return (
    <>
      <Hero />
      <PrintOnDemandBanner />
      <BestSellers />
      <Categories />
      <MaterialExplorer />
      <HowItWorks />
    </>
  )
}
