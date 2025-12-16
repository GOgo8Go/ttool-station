/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COPYRIGHT?: string;
  readonly VITE_ICP_INFO?: string;
  readonly VITE_POLICE_INFO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
import React from 'react';
import { useTranslation } from 'react-i18next';
import packageJson from '@/../package.json';

export const Footer: React.FC = () => {
    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();
    
    // 从环境变量获取配置信息
    const copyrightInfo = import.meta.env.VITE_COPYRIGHT || t('app.footer.copyright');
    const icpInfo = import.meta.env.VITE_ICP_INFO || t('app.footer.icp');
    const policeInfo = import.meta.env.VITE_POLICE_INFO || t('app.footer.police_filing');

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
                        © {currentYear} {copyrightInfo}
                    </a>
                    <span className="hidden sm:inline">•</span>
                    <span className="text-xs">v{packageJson.version} • {t('app.footer.info')}</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                    <a
                        href="https://beian.miit.gov.cn/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                        {icpInfo}
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
                        {policeInfo}
                    </a>
                </div>
            </div>
        </footer>
    );
};