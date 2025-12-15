import React from 'react';
import { useTranslation } from 'react-i18next';

export const Footer: React.FC = () => {
    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 px-6">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                    <a 
                        href="https://blog.zinc233.top"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                        © {currentYear} {t('app.footer.copyright')}
                    </a>
                    <span className="hidden sm:inline">•</span>
                    <span className="text-xs">{t('app.footer.version')} • {t('app.footer.info')}</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                    <a
                        href="https://beian.miit.gov.cn/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                        {t('app.footer.icp')}
                    </a>
                    <span className="hidden sm:inline">•</span>
                    <a
                        href="http://www.beian.gov.cn/portal/registerSystemInfo"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1"
                    >
                        <img
                            src="/beian.png"
                            alt="Police Filing"
                            className="w-4 h-4"
                        />
                        {t('app.footer.police_filing')}
                    </a>
                </div>
            </div>
        </footer>
    );
};