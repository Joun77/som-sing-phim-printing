import React from 'react'
import type { Product } from '../../data/catalog.ts'

interface ProductInfoTabsSectionProps {
  product: Product
  productName: string
  productDesc: string
  selectedCustomTab: string
  setSelectedCustomTab: (id: string) => void
  language: string
}

export function ProductInfoTabsSection({
  product,
  productName,
  productDesc,
  selectedCustomTab,
  setSelectedCustomTab,
  language,
}: ProductInfoTabsSectionProps) {
  const dynamicTabs = product.infoTabs || []
  const hasDesc = Boolean(productDesc?.trim() || (product.features && product.features.length > 0))
  const hasTabs = dynamicTabs.length > 0

  // If there are no real description and no real info tabs from backend, do not render mock data
  if (!hasDesc && !hasTabs) {
    return null
  }

  const currentTab = dynamicTabs.find((t) => t.id === selectedCustomTab)

  return (
    <div className="my-12 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
      {/* Dynamic Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-3">
        {hasDesc && (
          <button
            type="button"
            onClick={() => setSelectedCustomTab('description')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 flex-shrink-0 ${
              selectedCustomTab === 'description'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>📝 {language === 'en' ? 'Description & Details' : 'ລາຍລະອຽດສິນຄ້າ'}</span>
          </button>
        )}

        {dynamicTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedCustomTab(tab.id)}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 flex-shrink-0 ${
              selectedCustomTab === tab.id
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>
              {tab.icon || '📌'} {language === 'en' && tab.titleEn ? tab.titleEn : tab.titleLo}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Contents: Description */}
      {selectedCustomTab === 'description' && hasDesc && (
        <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 animate-fadeIn">
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            {productName}
          </h3>
          {productDesc && (
            <p className="whitespace-pre-line text-slate-600 dark:text-slate-400">
              {productDesc}
            </p>
          )}
          {product.features && product.features.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-bold text-slate-900 dark:text-white block">
                {language === 'en' ? 'Key Highlights:' : 'ຄຸນສົມບັດເດັ່ນ:'}
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                {product.features.map((feat, fIdx) => (
                  <li key={fIdx}>{feat}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Render Selected Dynamic Custom Tab Content (Real Backend Only) */}
      {selectedCustomTab !== 'description' && currentTab && (
        <div className="space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentTab.icon || '📌'}</span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white m-0">
              {language === 'en' && currentTab.titleEn ? currentTab.titleEn : currentTab.titleLo}
            </h3>
          </div>
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <p className="whitespace-pre-line text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
              {language === 'en' && currentTab.contentEn ? currentTab.contentEn : currentTab.contentLo}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
