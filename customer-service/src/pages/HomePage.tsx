import Hero from '../components/Hero.tsx'
import BestSellers from '../components/BestSellers.tsx'
import Categories from '../components/Categories.tsx'
import MaterialExplorer from '../components/MaterialExplorer.tsx'
import HowItWorks from '../components/HowItWorks.tsx'

export default function HomePage() {
  return (
    <>
      <Hero />
      <BestSellers />
      <Categories />
      <MaterialExplorer />
      <HowItWorks />
    </>
  )
}
