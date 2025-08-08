import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ScaleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

function TermsPage() {
  const navigate = useNavigate();

  const sections = [
    {
      icon: DocumentTextIcon,
      title: 'Terms of Service',
      content: [
        'By using Revado Health, you agree to these terms.',
        'You must be 18 years or older to use this service.',
        'You are responsible for maintaining the security of your account.',
        'You agree to provide accurate and complete information.',
      ]
    },
    {
      icon: ShieldCheckIcon,
      title: 'Privacy Policy',
      content: [
        'We collect only necessary health information to provide our services.',
        'Your data is encrypted and stored securely.',
        'We never share your personal health information without consent.',
        'You can request deletion of your data at any time.',
      ]
    },
    {
      icon: ScaleIcon,
      title: 'Data Rights',
      content: [
        'You own all your health records and data.',
        'You have the right to export your data anytime.',
        'You can delete your account and all associated data.',
        'We comply with HIPAA and other health data regulations.',
      ]
    },
    {
      icon: InformationCircleIcon,
      title: 'Medical Disclaimer',
      content: [
        'This app does not provide medical advice.',
        'Always consult healthcare professionals for medical decisions.',
        'AI-generated summaries are for reference only.',
        'Emergency situations require immediate medical attention.',
      ]
    }
  ];

  return (
    <div className="min-h-screen pb-20">
      <div className="pt-safe-top px-4">
        {/* Header */}
        <div className="flex items-center justify-between py-4 mb-6">
          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Terms & Conditions
          </h1>
          <div className="w-10" />
        </div>

        {/* Last Updated */}
        <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Last updated: January 8, 2025
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm"
            >
              <div className="flex items-start space-x-3 mb-4">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                  <section.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                  {section.title}
                </h2>
              </div>
              
              <ul className="space-y-2">
                {section.content.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-gray-400 dark:text-gray-500 mt-1">•</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-5 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
        >
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">
            Questions or Concerns?
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            If you have any questions about these terms, please contact us.
          </p>
          <div className="space-y-2">
            <a
              href="mailto:legal@revadohealth.com"
              className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              legal@revadohealth.com
            </a>
            <a
              href="tel:1-800-REVADO"
              className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              1-800-REVADO
            </a>
          </div>
        </motion.div>

        {/* Agreement Notice */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            By using Revado Health, you acknowledge that you have read, understood, 
            and agree to be bound by these Terms & Conditions and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

export default TermsPage;