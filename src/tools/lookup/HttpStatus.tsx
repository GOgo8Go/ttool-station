import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { Search, Info, Globe, AlertTriangle, CheckCircle, ServerCrash, HelpCircle, ArrowRight } from 'lucide-react';

export const HTTP_STATUS = {
   1: [0, 1, 2, 3],
   2: [0, 1, 2, 3, 4, 5, 6],
   3: [0, 1, 2, 3, 4, 5, 7, 8],
   4: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 21, 22, 25, 26, 28, 29, 31, 51],
   5: [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11]
}

const CATEGORIES = [
   { id: '1', icon: Info, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
   { id: '2', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800' },
   { id: '3', icon: ArrowRight, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800' },
   { id: '4', icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800' },
   { id: '5', icon: ServerCrash, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' },
];

const HttpStatus: React.FC = () => {
   const { t } = useTranslation();
   const [searchTerm, setSearchTerm] = useState('');
   const [selectedCategory, setSelectedCategory] = useState<string | null>(null);


   const filteredCodes: string[] = useMemo(() => {
      return Object
      .entries(HTTP_STATUS)
      .filter(([cate, _]) => !selectedCategory || cate == selectedCategory)
      .flatMap(([cate, values]) => values.map((value) => `${cate}${String(value).padStart(2, '0')}`))
      .filter((code) => 
         code.includes(searchTerm) ||
         t(`tool.http-status.title.${code}`).includes(searchTerm.toLowerCase()) ||
         t(`tool.http-status.description.${code}`).toLowerCase().includes(searchTerm.toLowerCase())
      );
   }, [searchTerm, selectedCategory, t]);

   return (
      <div className="flex flex-col space-y-6">

         {/* Search & Filter Toolbar */}
         <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
               <input
                  type="text"
                  placeholder={t('tool.http-status.ui.search_placeholder')}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
               <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors border ${!selectedCategory ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-transparent' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
               >
                  {t('tool.http-status.ui.all_codes')}
               </button>
               {CATEGORIES.map(cat => (
                  <button
                     key={cat.id}
                     onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                     className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors border flex items-center gap-2 ${selectedCategory === cat.id ? `${cat.bg} ${cat.color} ${cat.border} ring-1` : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                     <cat.icon className="w-3 h-3" />
                     {t(`tool.http-status.category.${cat.id}xx`)}
                  </button>
               ))}
            </div>
         </div>

         {/* Results Grid */}
         <div>
            {filteredCodes.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCodes.map(code => {
                     const style = CATEGORIES.find(c => c.id === code[0]);
                     const Icon = style?.icon || HelpCircle;

                     return (
                        <Card key={code} hover className="flex flex-col relative group overflow-hidden border-l-4" style={{ borderLeftColor: style?.color.replace('text-', 'var(--') }}>
                           {/* Colored stripe fallback if inline style fails or for custom visual */}
                           <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${style?.color}`}>
                              <Icon className="w-24 h-24 -mr-8 -mt-8" />
                           </div>

                           <div className="flex items-start justify-between mb-2 z-10">
                              <span className={`text-3xl font-black tracking-tighter ${style?.color}`}>
                                 {code}
                              </span>
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${style?.bg} ${style?.color} border ${style?.border}`}>
                                 {code[0]}
                              </span>
                           </div>

                           <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 z-10 group-hover:text-primary-600 transition-colors">
                              {t(`tool.http-status.title.${code}`)}
                           </h3>

                           <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed z-10">
                              {t(`tool.http-status.description.${code}`)}
                           </p>
                        </Card>
                     );
                  })}
               </div>
            ) : (
               <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <Globe className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg font-medium">{t('tool.http-status.ui.no_codes')}</p>
                  <p className="text-sm">{t('tool.http-status.ui.try_searching')}</p>
               </div>
            )}
         </div>
      </div>
   );
};

export default HttpStatus;