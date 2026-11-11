// Self-contained on purpose: scripts/build-map.mjs imports this file directly
// (Node type-stripping), so it must not use path aliases or runtime imports.

export type Localized = { en: string; hi: string };

export type Posting = {
  id: string;
  place: Localized;
  district: Localized;
  /** Year the posting began. */
  from: number;
  /** Year the posting ended; null means the current posting. */
  to: number | null;
  lat: number;
  lng: number;
};

export type SocialLink = {
  id: string;
  label: Localized;
  href: string;
};

export type Profile = {
  name: Localized;
  designation: Localized;
  /** Compact form for tight spaces (title tags, mobile header). */
  designationShort: Localized;
  serviceStartYear: number;
  bio: Localized;
  /** Path under /public, e.g. "/images/portrait.jpg". Undefined until a photo is supplied. */
  portrait?: string;
  postings: Posting[];
  social: SocialLink[];
};

export const profile: Profile = {
  name: {
    en: "Er. Sahab Singh Saini",
    hi: "इं. साहब सिंह सैनी",
  },
  designation: {
    en: "Additional Assistant Engineer (AAE), PWD Uttarakhand",
    hi: "अपर सहायक अभियंता, लोक निर्माण विभाग, उत्तराखंड",
  },
  designationShort: {
    en: "AAE, PWD Uttarakhand",
    hi: "अपर सहायक अभियंता, लोनिवि उत्तराखंड",
  },
  serviceStartYear: 2004,
  bio: {
    en: "Sahab Singh Saini is an Additional Assistant Engineer (AAE) with the Public Works Department, Government of Uttarakhand. Since joining the department in 2004, he has spent more than two decades building and maintaining the roads, bridges and public buildings that connect communities across the Garhwal hills and the plains of Haridwar district. His postings — from Ghansali in Tehri Garhwal to Roorkee, Srinagar, Narendra Nagar and now Dugadda — have given him hands-on experience of engineering in some of the state's most demanding terrain, where monsoon landslides, steep gradients and remote sites are part of the everyday brief. He believes good public infrastructure is measured by the people it quietly serves: the child who reaches school on time, the farmer who gets produce to market, and the patient who reaches hospital when it matters.",
    hi: "साहब सिंह सैनी उत्तराखंड सरकार के लोक निर्माण विभाग में अपर सहायक अभियंता हैं। वर्ष 2004 में विभाग से जुड़ने के बाद से वे दो दशकों से अधिक समय से गढ़वाल की पहाड़ियों और हरिद्वार ज़िले के मैदानी क्षेत्रों में सड़कों, पुलों और सार्वजनिक भवनों के निर्माण व रखरखाव में जुटे हैं। टिहरी गढ़वाल के घनसाली से लेकर रुड़की, श्रीनगर, नरेंद्रनगर और अब दुगड्डा तक की तैनाती ने उन्हें राज्य के सबसे चुनौतीपूर्ण भू-भाग में इंजीनियरिंग का प्रत्यक्ष अनुभव दिया है, जहाँ मानसून के भूस्खलन, खड़ी ढलानें और दूरस्थ कार्यस्थल रोज़मर्रा की चुनौती हैं। उनका मानना है कि अच्छे सार्वजनिक ढाँचे की असली पहचान वे लोग हैं जिनकी वह चुपचाप सेवा करता है — समय पर स्कूल पहुँचता बच्चा, मंडी तक उपज ले जाता किसान, और ज़रूरत के समय अस्पताल पहुँचता मरीज़।",
  },
  portrait: undefined,
  postings: [
    {
      id: "ghansali",
      place: { en: "Ghansali", hi: "घनसाली" },
      district: { en: "Tehri Garhwal", hi: "टिहरी गढ़वाल" },
      from: 2004,
      to: 2011,
      lat: 30.432,
      lng: 78.659,
    },
    {
      id: "roorkee",
      place: { en: "Roorkee", hi: "रुड़की" },
      district: { en: "Haridwar", hi: "हरिद्वार" },
      from: 2011,
      to: 2018,
      lat: 29.866,
      lng: 77.891,
    },
    {
      id: "srinagar-garhwal",
      place: { en: "Srinagar (Garhwal)", hi: "श्रीनगर (गढ़वाल)" },
      district: { en: "Pauri Garhwal", hi: "पौड़ी गढ़वाल" },
      from: 2018,
      to: 2020,
      lat: 30.223,
      lng: 78.783,
    },
    {
      id: "narendra-nagar",
      place: { en: "Narendra Nagar", hi: "नरेंद्रनगर" },
      district: { en: "Tehri Garhwal", hi: "टिहरी गढ़वाल" },
      from: 2020,
      to: 2025,
      lat: 30.163,
      lng: 78.288,
    },
    {
      id: "dugadda",
      place: { en: "Dugadda", hi: "दुगड्डा" },
      district: { en: "Pauri Garhwal", hi: "पौड़ी गढ़वाल" },
      from: 2025,
      to: null,
      lat: 29.805,
      lng: 78.612,
    },
  ],
  social: [],
};
