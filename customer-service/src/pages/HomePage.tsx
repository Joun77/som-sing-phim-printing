import Hero from '../components/Hero.tsx'
import PrintOnDemandBanner from '../components/PrintOnDemandBanner.tsx'
import BestSellers from '../components/BestSellers.tsx'
import Categories from '../components/Categories.tsx'
import MaterialExplorer from '../components/MaterialExplorer.tsx'
import HowItWorks from '../components/HowItWorks.tsx'
import { MemberPrivilegeStrip } from '../components/customer/MemberPrivilegeStrip.tsx'
import { QuickReorderShelf } from '../components/customer/QuickReorderShelf.tsx'
import { useShop } from '../context/ShopContext.tsx'

export default function HomePage() {
  const { setIsProfileModalOpen } = useShop()

  return (
    <>
      <MemberPrivilegeStrip onOpenHub={() => setIsProfileModalOpen(true)} />
      <Hero />
      <QuickReorderShelf onOpenHub={() => setIsProfileModalOpen(true)} />
      <PrintOnDemandBanner />
      <BestSellers />
      <Categories />
      <MaterialExplorer />
      <HowItWorks />
    </>
  )
}
