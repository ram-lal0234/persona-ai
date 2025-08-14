import Image from 'next/image';

interface PersonaCardProps {
  name: string;
  role: string;
  description: string;
  imageSrc: string;
  isSelected: boolean;
  onClick: () => void;
}

export default function PersonaCard({ name, role, description, imageSrc, isSelected, onClick }: PersonaCardProps) {
  return (
    <div
      className={`relative cursor-pointer rounded-2xl border-2 p-6 transition-all duration-300 hover:scale-105 ${
        isSelected 
          ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 shadow-2xl shadow-orange-200' 
          : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-xl hover:shadow-orange-100'
      }`}
      onClick={onClick}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-transparent via-transparent to-orange-50/30 opacity-0 hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10 flex items-start space-x-4">
        {/* Avatar */}
        <div className="relative h-16 w-16 overflow-hidden rounded-2xl border-4 border-white shadow-lg">
          <Image
            src={imageSrc}
            alt={name}
            fill
            className="object-cover"
          />
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-transparent via-transparent to-white/20" />
        </div>
        
        {/* Content */}
        <div className="flex-1 space-y-2">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{name}</h3>
            <p className="text-sm font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-full inline-block">
              {role}
            </p>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
          
          {/* Action Button */}
          <button className="mt-3 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-medium hover:from-orange-600 hover:to-amber-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm">
            Start Chatting
          </button>
        </div>
        
        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 flex items-center justify-center shadow-lg">
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      
      {/* Hover Effect Border */}
      <div className={`absolute inset-0 rounded-2xl border-2 transition-all duration-300 ${
        isSelected 
          ? 'border-orange-500' 
          : 'border-transparent hover:border-orange-200'
      }`} />
    </div>
  );
} 