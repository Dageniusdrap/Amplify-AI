import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { ListBulletIcon } from './icons/ListBulletIcon';
import { ShareIcon } from './icons/ShareIcon';
import { MegaphoneIcon } from './icons/MegaphoneIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { Loader } from './Loader';

interface BannerButtonProps {
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  title: string;
  onClick: () => void;
  isLoading: boolean;
  onCancel: () => void;
}

const BannerButton: React.FC<BannerButtonProps> = ({ icon: Icon, title, onClick, isLoading, onCancel }) => {
  return (
    <button
      onClick={isLoading ? onCancel : onClick}
      className={`relative flex flex-col items-center justify-center p-4 text-center bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 border border-gray-200 dark:border-gray-700 ${isLoading ? 'ring-2 ring-indigo-500' : 'hover:ring-2 hover:ring-indigo-400'}`}
    >
      {isLoading ? (
          <>
            <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex flex-col items-center justify-center rounded-lg">
                <Loader />
                <span className="text-xs text-red-500 mt-2">Cancel</span>
            </div>
            <Icon className="h-8 w-8 text-indigo-500 mb-2 opacity-20" />
            <h5 className="font-semibold text-sm text-gray-800 dark:text-gray-200 opacity-20">{title}</h5>
          </>
      ) : (
          <>
            <Icon className="h-8 w-8 text-indigo-500 mb-2" />
            <h5 className="font-semibold text-sm text-gray-800 dark:text-gray-200">{title}</h5>
          </>
      )}
    </button>
  );
};


interface AmplifyBannerProps {
    isGeneratingImproved: boolean;
    onGenerateImprovedContent: () => void;
    isGeneratingSocialPost: boolean;
    onGenerateSocialPost: () => void;
    isGeneratingProductAd: boolean;
    onGenerateProductAd: () => void;
    isGeneratingKeyTakeaways: boolean;
    onGenerateKeyTakeaways: () => void;
    onCancel: () => void;
    hasContentToImprove: boolean;
}

export const AmplifyBanner: React.FC<AmplifyBannerProps> = (props) => {
  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-white">Ready to Amplify?</h3>
      <p className="text-sm text-indigo-200 mt-1">Take your content to the next level with one click.</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        {props.hasContentToImprove && (
            <BannerButton 
                icon={SparklesIcon}
                title="Improve Script"
                onClick={props.onGenerateImprovedContent}
                isLoading={props.isGeneratingImproved}
                onCancel={props.onCancel}
            />
        )}
        <BannerButton 
            icon={ListBulletIcon}
            title="Key Takeaways"
            onClick={props.onGenerateKeyTakeaways}
            isLoading={props.isGeneratingKeyTakeaways}
            onCancel={props.onCancel}
        />
        <BannerButton 
            icon={ShareIcon}
            title="Social Post"
            onClick={props.onGenerateSocialPost}
            isLoading={props.isGeneratingSocialPost}
            onCancel={props.onCancel}
        />
        <BannerButton 
            icon={MegaphoneIcon}
            title="Product Ad"
            onClick={props.onGenerateProductAd}
            isLoading={props.isGeneratingProductAd}
            onCancel={props.onCancel}
        />
      </div>
    </div>
  );
};