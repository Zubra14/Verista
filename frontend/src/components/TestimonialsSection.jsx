// /Users/zukonkonjane/Verista/frontend/src/components/TestimonialsSection.jsx
import React from 'react';

const TestimonialsSection = () => {
  return (
    <section className="py-24 bg-gradient-to-br from-blue-50 to-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute left-0 top-0 w-64 h-64 bg-blue-100 rounded-full opacity-50 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute right-0 bottom-0 w-64 h-64 bg-blue-100 rounded-full opacity-50 translate-x-1/2 translate-y-1/2"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-blue-600 font-medium mb-2">TESTIMONIALS</h2>
          <h3 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">What Our Users Say</h3>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Hear from parents, schools, and drivers who have experienced the benefits of Verista.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Testimonial 1 */}
          <div className="bg-white p-8 rounded-xl shadow-md relative">
            <div className="absolute -top-5 left-8">
              <svg width="42" height="30" viewBox="0 0 42 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.7984 0.209981C13.8928 0.209981 15.7632 1.13798 17.4096 2.99398C19.056 4.84998 19.8792 7.09598 19.8792 9.73198C19.8792 12.768 18.8536 15.492 16.8024 17.904C14.7512 20.316 11.8152 22.308 8.0064 23.88L6.0384 19.896C9.0768 18.696 11.3328 17.208 12.8064 15.432C14.28 13.656 15.0768 11.688 15.1968 9.52798C14.6544 9.64798 14.1456 9.70798 13.6704 9.70798C11.5296 9.70798 9.7632 9.00798 8.3712 7.60798C6.9792 6.20798 6.2832 4.47998 6.2832 2.42398C6.2832 1.62398 6.4368 0.871981 6.744 0.167981C7.0512 -0.536019 7.5 -1.1 8.0904 -1.52C8.6808 -1.94 9.4152 -2.228 10.2936 -2.384C11.172 -2.54 12.0504 -2.444 12.9288 -2.096C13.0488 -2.096 13.1688 -2.084 13.2888 -2.06C13.4088 -2.036 13.5288 -2.012 13.6488 -1.988L13.9224 -1.88L13.7688 -1.64C13.1688 -0.392 12.8688 0.173981 11.7984 0.209981Z" fill="#3B82F6"/>
                <path d="M34.2192 0.209981C36.3136 0.209981 38.184 1.13798 39.8304 2.99398C41.4768 4.84998 42.3 7.09598 42.3 9.73198C42.3 12.768 41.2744 15.492 39.2232 17.904C37.172 20.316 34.236 22.308 30.4272 23.88L28.4592 19.896C31.4976 18.696 33.7536 17.208 35.2272 15.432C36.7008 13.656 37.4976 11.688 37.6176 9.52798C37.0752 9.64798 36.5664 9.70798 36.0912 9.70798C33.9504 9.70798 32.184 9.00798 30.792 7.60798C29.4 6.20798 28.704 4.47998 28.704 2.42398C28.704 0.367981 29.4 -1.36 30.792 -2.76C32.184 -4.16 33.9504 -4.86 36.0912 -4.86C36.8112 -4.86 37.5312 -4.764 38.2512 -4.572C38.9712 -4.38 39.6144 -4.056 40.1808 -3.6C40.7472 -3.144 41.184 -2.52 41.4912 -1.728C41.7984 -0.936 41.952 -0.0360189 41.952 0.983981C41.952 1.10398 41.94 1.23598 41.916 1.37998C41.892 1.52398 41.868 1.66798 41.844 1.81198L41.736 2.08598L41.496 1.93198C40.248 1.33198 39.6816 1.03198 39.6816 -0.0380189C39.6816 -0.038018 36.4152 0.209981 34.2192 0.209981Z" fill="#3B82F6"/>
              </svg>
            </div>
            
            <div className="pt-6">
              <p className="text-gray-600 mb-6 italic">
                "As a parent, the peace of mind I get from being able to track my child's school commute in real-time is invaluable. The notifications for pickup and drop-off have made our mornings much less stressful."
              </p>
              
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden mr-4">
                  {/* Replace with actual profile image */}
                  <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-500 font-bold">TM</div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">Thandi Mbeki</h4>
                  <p className="text-gray-500 text-sm">Parent, Johannesburg</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Testimonial 2 */}
          <div className="bg-white p-8 rounded-xl shadow-md relative">
            <div className="absolute -top-5 left-8">
              <svg width="42" height="30" viewBox="0 0 42 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.7984 0.209981C13.8928 0.209981 15.7632 1.13798 17.4096 2.99398C19.056 4.84998 19.8792 7.09598 19.8792 9.73198C19.8792 12.768 18.8536 15.492 16.8024 17.904C14.7512 20.316 11.8152 22.308 8.0064 23.88L6.0384 19.896C9.0768 18.696 11.3328 17.208 12.8064 15.432C14.28 13.656 15.0768 11.688 15.1968 9.52798C14.6544 9.64798 14.1456 9.70798 13.6704 9.70798C11.5296 9.70798 9.7632 9.00798 8.3712 7.60798C6.9792 6.20798 6.2832 4.47998 6.2832 2.42398C6.2832 1.62398 6.4368 0.871981 6.744 0.167981C7.0512 -0.536019 7.5 -1.1 8.0904 -1.52C8.6808 -1.94 9.4152 -2.228 10.2936 -2.384C11.172 -2.54 12.0504 -2.444 12.9288 -2.096C13.0488 -2.096 13.1688 -2.084 13.2888 -2.06C13.4088 -2.036 13.5288 -2.012 13.6488 -1.988L13.9224 -1.88L13.7688 -1.64C13.1688 -0.392 12.8688 0.173981 11.7984 0.209981Z" fill="#3B82F6"/>
                <path d="M34.2192 0.209981C36.3136 0.209981 38.184 1.13798 39.8304 2.99398C41.4768 4.84998 42.3 7.09598 42.3 9.73198C42.3 12.768 41.2744 15.492 39.2232 17.904C37.172 20.316 34.236 22.308 30.4272 23.88L28.4592 19.896C31.4976 18.696 33.7536 17.208 35.2272 15.432C36.7008 13.656 37.4976 11.688 37.6176 9.52798C37.0752 9.64798 36.5664 9.70798 36.0912 9.70798C33.9504 9.70798 32.184 9.00798 30.792 7.60798C29.4 6.20798 28.704 4.47998 28.704 2.42398C28.704 0.367981 29.4 -1.36 30.792 -2.76C32.184 -4.16 33.9504 -4.86 36.0912 -4.86C36.8112 -4.86 37.5312 -4.764 38.2512 -4.572C38.9712 -4.38 39.6144 -4.056 40.1808 -3.6C40.7472 -3.144 41.184 -2.52 41.4912 -1.728C41.7984 -0.936 41.952 -0.0360189 41.952 0.983981C41.952 1.10398 41.94 1.23598 41.916 1.37998C41.892 1.52398 41.868 1.66798 41.844 1.81198L41.736 2.08598L41.496 1.93198C40.248 1.33198 39.6816 1.03198 39.6816 -0.0380189C39.6816 -0.038018 36.4152 0.209981 34.2192 0.209981Z" fill="#3B82F6"/>
              </svg>
            </div>
            
            <div className="pt-6">
              <p className="text-gray-600 mb-6 italic">
                "Implementing Verista at our school has revolutionized transportation management. We've seen a 35% reduction in late arrivals and parents are much more engaged and satisfied with our transport service."
              </p>
              
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden mr-4">
                  {/* Replace with actual profile image */}
                  <div className="w-full h-full bg-green-100 flex items-center justify-center text-green-500 font-bold">SM</div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">Sipho Mkhize</h4>
                  <p className="text-gray-500 text-sm">Principal, Cape Town</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Testimonial 3 */}
          <div className="bg-white p-8 rounded-xl shadow-md relative">
            <div className="absolute -top-5 left-8">
              <svg width="42" height="30" viewBox="0 0 42 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.7984 0.209981C13.8928 0.209981 15.7632 1.13798 17.4096 2.99398C19.056 4.84998 19.8792 7.09598 19.8792 9.73198C19.8792 12.768 18.8536 15.492 16.8024 17.904C14.7512 20.316 11.8152 22.308 8.0064 23.88L6.0384 19.896C9.0768 18.696 11.3328 17.208 12.8064 15.432C14.28 13.656 15.0768 11.688 15.1968 9.52798C14.6544 9.64798 14.1456 9.70798 13.6704 9.70798C11.5296 9.70798 9.7632 9.00798 8.3712 7.60798C6.9792 6.20798 6.2832 4.47998 6.2832 2.42398C6.2832 1.62398 6.4368 0.871981 6.744 0.167981C7.0512 -0.536019 7.5 -1.1 8.0904 -1.52C8.6808 -1.94 9.4152 -2.228 10.2936 -2.384C11.172 -2.54 12.0504 -2.444 12.9288 -2.096C13.0488 -2.096 13.1688 -2.084 13.2888 -2.06C13.4088 -2.036 13.5288 -2.012 13.6488 -1.988L13.9224 -1.88L13.7688 -1.64C13.1688 -0.392 12.8688 0.173981 11.7984 0.209981Z" fill="#3B82F6"/>
                <path d="M34.2192 0.209981C36.3136 0.209981 38.184 1.13798 39.8304 2.99398C41.4768 4.84998 42.3 7.09598 42.3 9.73198C42.3 12.768 41.2744 15.492 39.2232 17.904C37.172 20.316 34.236 22.308 30.4272 23.88L28.4592 19.896C31.4976 18.696 33.7536 17.208 35.2272 15.432C36.7008 13.656 37.4976 11.688 37.6176 9.52798C37.0752 9.64798 36.5664 9.70798 36.0912 9.70798C33.9504 9.70798 32.184 9.00798 30.792 7.60798C29.4 6.20798 28.704 4.47998 28.704 2.42398C28.704 0.367981 29.4 -1.36 30.792 -2.76C32.184 -4.16 33.9504 -4.86 36.0912 -4.86C36.8112 -4.86 37.5312 -4.764 38.2512 -4.572C38.9712 -4.38 39.6144 -4.056 40.1808 -3.6C40.7472 -3.144 41.184 -2.52 41.4912 -1.728C41.7984 -0.936 41.952 -0.0360189 41.952 0.983981C41.952 1.10398 41.94 1.23598 41.916 1.37998C41.892 1.52398 41.868 1.66798 41.844 1.81198L41.736 2.08598L41.496 1.93198C40.248 1.33198 39.6816 1.03198 39.6816 -0.0380189C39.6816 -0.038018 36.4152 0.209981 34.2192 0.209981Z" fill="#3B82F6"/>
              </svg>
            </div>
            
            <div className="pt-6">
              <p className="text-gray-600 mb-6 italic">
                "As a driver, Verista has made my job easier and more organized. The routes are optimized, and I can communicate easily with parents. The safety features give everyone peace of mind."
              </p>
              
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden mr-4">
                  {/* Replace with actual profile image */}
                  <div className="w-full h-full bg-yellow-100 flex items-center justify-center text-yellow-500 font-bold">MD</div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">Moses Dlamini</h4>
                  <p className="text-gray-500 text-sm">Driver, Durban</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;