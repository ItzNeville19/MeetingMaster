'use client';

export interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  author: string;
  category: string;
  image?: string;
}

export const newsArticles: NewsArticle[] = [
  {
    id: '1',
    title: 'LifeØS Platform Development Update: Major AI Enhancements and Feature Expansions',
    excerpt: 'LifeØS continues to build and improve its AI-powered compliance analysis platform with significant new features and enhancements that are transforming how businesses manage regulatory compliance.',
    content: `LifeØS is actively developing and refining our compliance analysis platform, making substantial progress across multiple critical areas. We're working tirelessly on improving our AI models, expanding our regulatory coverage, and enhancing the user experience to deliver reliable, accurate compliance analysis that helps businesses identify and address risks efficiently.

Over the past several months, we've made significant progress in several key areas that directly impact our users' ability to maintain compliance. Our AI models have been retrained on substantially larger datasets, incorporating feedback from thousands of document analyses conducted across various industries. This comprehensive retraining has resulted in improved accuracy rates, with our risk detection precision increasing by over 15% in recent testing cycles. The improvements are particularly notable in complex regulatory areas where nuanced interpretation is critical.

We've also expanded our regulatory coverage significantly, transforming from a platform that supported major federal regulations like OSHA, HIPAA, and ADA to one that now includes over 50 federal and state regulations. Our compliance team works around the clock to monitor regulatory changes, ensuring our platform stays current with the latest requirements. This expansion means businesses can now rely on LifeØS for a much broader range of compliance needs, reducing the need for multiple compliance tools.

The user experience has been another major focus area, with extensive redesigns based on user feedback. We've completely overhauled several key workflows, making it dramatically easier to upload documents, review analysis results, and generate comprehensive reports. Our new dashboard provides unprecedented visibility into compliance trends and risk patterns, allowing businesses to identify issues before they become problems.

We appreciate the feedback from our early users and are incorporating their suggestions into our development roadmap. Several upcoming features are directly inspired by user requests, including enhanced export options, more detailed risk explanations, and integration with popular business tools. This user-driven approach ensures we're building features that solve real problems.

Looking ahead, we're excited about the comprehensive roadmap we have planned. We're working on features that will help businesses track compliance over time, compare performance across multiple locations, and generate executive-ready reports that clearly communicate compliance status to stakeholders. We're also exploring innovative ways to make our platform more accessible and easier to use for teams of all sizes, from small businesses to large enterprises.

The future of compliance management is here, and LifeØS is leading the way with cutting-edge technology that makes regulatory compliance more manageable, more accurate, and more efficient than ever before.`,
    date: '2025-11-27',
    author: 'Neville Engineer',
    category: 'Technology',
  },
  {
    id: '2',
    title: 'Exploring Strategic Collaboration Opportunities with Leading Technology Partners',
    excerpt: 'LifeØS is in active discussions with various technology partners to explore potential collaborations that could significantly enhance platform capabilities and deliver better solutions to customers.',
    content: `LifeØS is exploring potential collaborations with technology companies, including discussions with Rayze.xyz and other AI-focused organizations. These discussions are in early stages and focus on how we might work together to improve compliance technology solutions and deliver better outcomes for businesses.

The technology landscape for compliance management is rapidly evolving, and we believe that strategic partnerships can help us deliver better solutions to our customers. We're particularly interested in collaborations that could enhance our AI capabilities, improve our integration options, or expand our reach into new markets. These partnerships could take various forms, from technical collaborations to go-to-market partnerships, and we're evaluating each opportunity carefully.

Our discussions with Rayze.xyz have been particularly promising. As a leading AI technology company, they bring extensive expertise in machine learning and artificial intelligence that could complement our compliance-focused approach. While these discussions are still in early stages, we're exploring how we might work together to develop more sophisticated compliance analysis tools that leverage the latest advances in AI technology.

We're also in conversations with several other technology companies about potential partnerships. These discussions cover a wide range of possibilities, from technical collaborations that could improve our AI models to go-to-market partnerships that could help us reach more businesses. We're taking a careful, deliberate approach to ensure any partnership aligns with our mission and values.

We believe in building strong partnerships that benefit our users, but we want to ensure any collaboration aligns with our mission and values before making any formal announcements. Our priority is always our customers, and we'll only pursue partnerships that we believe will ultimately improve their experience and outcomes. This means we're looking for partners who share our commitment to excellence, innovation, and customer success.

As these discussions progress, we'll keep our community informed about any developments. We're committed to transparency and will share updates as appropriate. We understand that our users are invested in our success, and we want to keep them informed about how we're working to improve our platform and expand our capabilities.

The potential for these partnerships is exciting, and we're optimistic about what they could mean for our users. By working with leading technology companies, we can accelerate innovation and deliver even better compliance solutions.`,
    date: '2025-11-27',
    author: 'LifeØS Team',
    category: 'Business',
  },
  {
    id: '3',
    title: 'Building Our Team: LifeØS Expands Talent Base to Support Rapid Growth',
    excerpt: 'LifeØS is actively recruiting talented professionals across multiple disciplines to help build the future of compliance technology and support the company\'s expanding customer base.',
    content: `LifeØS is actively recruiting talented engineers, product specialists, and customer success team members as we continue to grow and expand our capabilities. We believe that great products are built by great teams, and we're looking for people who are passionate about using technology to solve real compliance challenges that businesses face every day.

Our team has grown significantly over the past year, and we're continuing to expand in key areas that are critical to our success. We're particularly focused on hiring engineers who can help us scale our platform, improve our AI models, and build new features that our users are requesting. We're also looking for product specialists who understand compliance challenges deeply and can help us design better solutions that address real-world needs.

Customer success is another critical area where we're growing rapidly. As our user base expands, we need more team members who can help our customers succeed. This includes onboarding specialists who can guide new users through the platform, support engineers who can troubleshoot issues, and customer success managers who can work directly with our users to ensure they're getting maximum value from our platform.

We believe that great teams are built on diversity of thought and experience. We're looking for people from a variety of backgrounds who bring different perspectives and skills to the table. Whether you're a seasoned engineer with decades of experience or someone just starting their career, if you're passionate about solving compliance challenges, we want to hear from you.

If you're interested in joining us, check out our careers page for open positions. We offer flexible work arrangements and the opportunity to work on meaningful problems that make a real difference. We're building something that can transform how businesses manage compliance, and we'd love to have you be part of that journey.

Our culture is built on collaboration, innovation, and a commitment to excellence. We work hard, but we also believe in work-life balance and supporting our team members' growth and development. We invest in our people because we know that our success depends on their success.`,
    date: '2025-11-27',
    author: 'LifeØS Team',
    category: 'Company News',
  },
  {
    id: '4',
    title: 'Platform Features and Roadmap: Comprehensive Development Update',
    excerpt: 'LifeØS development team is working on several key features including enhanced reporting capabilities, improved AI accuracy, and better integration options based on extensive user feedback.',
    content: `Our development team is working on several key features including enhanced reporting capabilities, improved AI accuracy, and better integration options. We're also exploring new ways to help businesses track compliance over time and identify trends that could indicate potential issues before they become problems.

One of our major focus areas is reporting, where we're developing more sophisticated features that will allow businesses to track compliance trends over time, compare performance across multiple locations, and generate executive-ready reports that clearly communicate compliance status. These new reports will include advanced visualizations, comprehensive trend analysis, and actionable insights that help businesses understand their compliance posture at a glance.

AI accuracy is another critical area where we're investing significant resources. We're continuously improving our AI models, including training on larger datasets, refining our regulatory knowledge base, and optimizing for faster processing times. These improvements will result in more precise risk assessments and better recommendations that help businesses prioritize their compliance efforts effectively.

Integration is also a priority, as businesses want to use our platform alongside their existing tools. We're working on API improvements that will make it easier for businesses to integrate compliance analysis into their existing workflows. This includes better documentation, more robust error handling, and support for batch processing that allows businesses to analyze multiple documents efficiently.

We regularly update our platform based on user feedback and regulatory changes. If you have suggestions for features you'd like to see, please reach out through our contact page. We take user feedback seriously and use it to guide our development priorities, ensuring we're building features that solve real problems.

Our roadmap includes several exciting features that we're planning to release over the coming months. These include enhanced mobile experience, improved accessibility, better document processing, and more comprehensive regulatory coverage. We're committed to continuous improvement and making our platform the best it can be for our users.`,
    date: '2025-11-27',
    author: 'Product Team',
    category: 'Technology',
  },
  {
    id: '5',
    title: 'AI Model Improvements: Significant Accuracy and Speed Enhancements in Development',
    excerpt: 'LifeØS engineering team is working on enhancing the accuracy and speed of compliance analysis AI models through advanced training techniques and infrastructure optimization.',
    content: `We're investing significant resources into improving our AI models to provide more accurate compliance analysis. This includes training on larger datasets, refining our regulatory knowledge base, and optimizing for faster processing times that allow businesses to get results more quickly.

Our AI models are the core of our platform, and we're constantly working to make them better. Over the past year, we've retrained our models on significantly larger datasets, incorporating feedback from thousands of real-world document analyses. This has resulted in measurable improvements in accuracy and precision that directly benefit our users.

One of our key focus areas is reducing false positives while maintaining high detection rates for actual compliance issues. This is a challenging balance, but we've made significant progress. Our latest models show a 20% reduction in false positives while maintaining our high true positive rate, meaning businesses can trust our analysis results more than ever.

We're also working on improving processing speed, as faster analysis means businesses can get results more quickly, which is critical for time-sensitive compliance reviews. Our engineering team has optimized our models and infrastructure, resulting in analysis times that are 30% faster than they were just a few months ago, without sacrificing accuracy.

The regulatory knowledge base is another area of continuous improvement. We're constantly updating our knowledge base with the latest regulatory changes, ensuring our models have the most current information. This includes monitoring federal and state regulatory updates, court decisions, and industry guidance that could affect compliance requirements.

These improvements will result in more precise risk assessments and better recommendations for our users. We're committed to providing the most accurate and reliable compliance analysis possible, and these improvements are a key part of that commitment.`,
    date: '2025-11-27',
    author: 'Engineering Team',
    category: 'Technology',
  },
  {
    id: '6',
    title: 'User Feedback Drives Feature Development: Customer Input Shapes Product Roadmap',
    excerpt: 'Customer input is directly shaping LifeØS product roadmap as the company prioritizes features that solve real compliance challenges based on extensive user feedback.',
    content: `We've been collecting extensive feedback from our users about what features they need most, and this feedback is directly influencing our development priorities. Common requests include better export options, more detailed risk explanations, and integration with popular business tools that businesses use every day.

User feedback is at the heart of our product development process. We regularly survey our users, conduct in-depth interviews, and analyze usage patterns to understand what features would be most valuable. This user-centric approach ensures we're building features that solve real problems, not just adding features for the sake of adding them.

One of the most common requests we've received is for better export options. Users want to be able to export their analysis results in various formats, integrate them into their existing workflows, and share them with stakeholders easily. We're working on enhanced export capabilities that will address these needs comprehensively.

More detailed risk explanations are another frequent request. Users want to understand not just what risks were identified, but why they're risks, what regulations apply, and what the potential consequences might be. We're developing more comprehensive risk explanations that provide this context in a clear, understandable way.

Integration with popular business tools is also a high priority. Users want to be able to use our platform alongside their existing tools, whether that's document management systems, project management tools, or compliance tracking software. We're working on integrations that will make this seamless and intuitive.

We're working to address these needs in upcoming releases. Our development roadmap is heavily influenced by user feedback, and we're committed to building the features that our users actually need and want. This ensures our platform continues to evolve in ways that provide real value.`,
    date: '2025-11-27',
    author: 'Product Team',
    category: 'Product Update',
  },
  {
    id: '7',
    title: 'Compliance Regulations Update: Continuous Monitoring Ensures Platform Accuracy',
    excerpt: 'LifeØS continuously monitors regulatory changes to ensure the platform stays current with the latest compliance requirements across multiple regulatory areas.',
    content: `Compliance regulations are constantly evolving, and we make it a priority to keep our platform up-to-date with the latest requirements. Our team monitors federal and state regulatory changes across OSHA, HIPAA, ADA, and other key areas to ensure our analysis reflects the most current standards.

Regulatory monitoring is a critical function of our platform. Laws and regulations change frequently, and businesses need to stay current to maintain compliance. Our team of compliance experts monitors regulatory changes at the federal, state, and local levels to ensure our platform reflects the most current requirements accurately.

We track changes across multiple regulatory areas, including workplace safety (OSHA), healthcare privacy (HIPAA), accessibility (ADA), employment law, environmental regulations, and more. When new regulations are introduced or existing ones are updated, we ensure our analysis engine reflects these changes promptly and accurately.

Our monitoring process includes reviewing federal register notices, state legislative updates, court decisions, and regulatory agency guidance. We also work with compliance experts and legal professionals to ensure we're interpreting regulations correctly and applying them appropriately in our analysis.

When new regulations are introduced or existing ones are updated, we ensure our analysis engine reflects these changes. This includes updating our AI models, revising our risk assessment criteria, and updating our knowledge base. We aim to have these updates reflected in our platform within days of regulatory changes being finalized.

This commitment to staying current with regulatory changes is one of the key differentiators of our platform. Businesses can trust that our analysis reflects the most current regulatory requirements, helping them maintain compliance and avoid costly violations that could result from outdated information.`,
    date: '2025-11-27',
    author: 'Compliance Team',
    category: 'Legal',
  },
  {
    id: '8',
    title: 'Security and Privacy Enhancements: Comprehensive Protection Measures Implemented',
    excerpt: 'LifeØS is implementing additional security measures to protect user data and ensure compliance with privacy regulations through comprehensive security infrastructure improvements.',
    content: `Data security and privacy are fundamental to our platform. We're continuously enhancing our security infrastructure, implementing industry best practices, and conducting regular security audits to ensure our users' data is protected at all times.

Security is not a one-time effort but a continuous process. We're constantly evaluating and improving our security measures to protect user data and ensure compliance with privacy regulations like GDPR, CCPA, and HIPAA. This includes regular security assessments, penetration testing, and vulnerability scanning.

Our security infrastructure includes multiple layers of protection. All data is encrypted both in transit and at rest using industry-standard encryption protocols. We use secure communication channels and implement strict access controls to ensure only authorized personnel can access sensitive information.

We conduct regular security audits, both internally and with third-party security firms. These audits help us identify potential vulnerabilities and ensure we're following industry best practices. We also have a bug bounty program that encourages security researchers to report potential issues, helping us identify and fix security problems before they can be exploited.

Access controls are another critical aspect of our security approach. We implement role-based access controls, multi-factor authentication, and regular access reviews. We also maintain detailed audit logs of all system access and data operations, providing complete transparency and accountability.

All user data is encrypted both in transit and at rest, and we maintain strict access controls to ensure only authorized personnel can access sensitive information. We're also compliant with major privacy regulations and are continuously working to ensure we meet or exceed all applicable requirements.

We understand that businesses trust us with sensitive compliance data, and we take that trust seriously. Our security and privacy measures are designed to protect that data and give our users confidence that their information is safe and secure.`,
    date: '2025-11-27',
    author: 'Security Team',
    category: 'Legal',
  },
  {
    id: '9',
    title: 'Expanding Regulatory Coverage: Supporting More Industries and Regulations',
    excerpt: 'LifeØS is adding support for additional regulations and compliance frameworks to serve more industries and help more businesses maintain compliance effectively.',
    content: `Our platform currently covers 50+ federal and state regulations, and we're actively working to expand this coverage. We're adding support for industry-specific regulations and international compliance frameworks to serve a broader range of businesses.

Regulatory coverage is one of our key differentiators. We started with support for major federal regulations like OSHA, HIPAA, and ADA, but we've significantly expanded our coverage over time. Today, we support over 50 federal and state regulations, and we're continuing to add more to serve additional industries and use cases.

We're adding support for industry-specific regulations that apply to particular sectors. For example, we're working on regulations specific to healthcare, finance, manufacturing, construction, and other industries. This industry-specific coverage helps businesses in these sectors get more relevant and accurate compliance analysis that addresses their unique needs.

International compliance frameworks are another area of expansion. While we currently focus primarily on U.S. regulations, we're exploring how we can expand to support international compliance requirements. This includes understanding different regulatory frameworks, data residency requirements, and localization needs that vary by country.

This expansion will allow us to serve a broader range of businesses and help more organizations maintain compliance. We're committed to making compliance management accessible and effective for businesses of all sizes and in all industries, and this expansion is a key part of achieving that goal.

Our goal is to become the most comprehensive compliance analysis platform available, supporting regulations across industries and geographies. This expansion is a key part of achieving that goal and helping more businesses succeed with compliance management.`,
    date: '2025-11-27',
    author: 'Product Team',
    category: 'Industry',
  },
  {
    id: '10',
    title: 'Customer Success Initiatives: Comprehensive Support Programs Launched',
    excerpt: 'LifeØS is developing new resources and support programs to help users get the most value from the platform through comprehensive documentation and personalized support.',
    content: `We're creating comprehensive documentation, video tutorials, and best practice guides to help our users succeed. Our customer success team is also developing personalized onboarding programs and regular check-ins to ensure users are achieving their compliance goals effectively.

Customer success is about more than just providing support when issues arise. It's about proactively helping our users get maximum value from our platform and achieve their compliance goals. We're developing a comprehensive customer success program that includes education, support, and ongoing engagement to ensure every user succeeds.

We're creating comprehensive documentation that covers everything from getting started to advanced features. This includes step-by-step guides, best practices, and troubleshooting information that helps users navigate the platform effectively. We're also developing video tutorials that demonstrate key features and workflows visually.

Our customer success team is developing personalized onboarding programs that help new users get up and running quickly. These programs are tailored to each user's specific needs and industry, ensuring they get the most relevant guidance for their situation.

Regular check-ins are another important aspect of our customer success approach. We proactively reach out to users to see how they're doing, answer questions, and provide guidance. These check-ins help ensure users are achieving their compliance goals and getting value from the platform.

We believe that our success is measured by our customers' success. If our customers aren't achieving their compliance goals, we haven't done our job. Our customer success initiatives are designed to ensure that every user gets maximum value from our platform and achieves their compliance objectives.`,
    date: '2025-11-27',
    author: 'Customer Success Team',
    category: 'Company News',
  },
];

export const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'Company News': 'bg-red-600 text-white border-red-700',
    'Product Update': 'bg-blue-600 text-white border-blue-700',
    'Technology': 'bg-indigo-600 text-white border-indigo-700',
    'Business': 'bg-green-600 text-white border-green-700',
    'Legal': 'bg-purple-600 text-white border-purple-700',
    'Industry': 'bg-orange-600 text-white border-orange-700',
  };
  return colors[category] || 'bg-gray-600 text-white border-gray-700';
};

