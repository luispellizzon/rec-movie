/* eslint-disable @typescript-eslint/no-explicit-any */
import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {
  PreferencesFormData,
  PreferencesErrors,
  preferencesSchema,
} from "@/schemas/preferencesSchema";
import Navbar from "@/components/NavBar";
import {Loading} from "@/components/Loading";
import {toast} from "sonner";

const genreOptions = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Thriller",
  "Western",
] as const;

const moodOptions = [
  "Happy",
  "Sad",
  "Excited",
  "Relaxed",
  "Adventurous",
  "Romantic",
  "Scared",
  "Thoughtful",
  "Energetic",
  "Melancholic",
] as const;

export const Preferences: React.FC = () => {
  const navigate = useNavigate();

  const [selectedMood, setSelectedMood] = useState<string>("");
  const [freeTime, setFreeTime] = useState<string>("90");
  const [language, setLanguage] = useState<string>("any");
  const [country, setCountry] = useState<string>("any");
  const [era, setEra] = useState<string>("any");
  const [popularity, setPopularity] = useState<string>("any");
  const [genres, setGenres] = useState<string[]>([]);
  const [movieCount, setMovieCount] = useState<string>("5");
  const [errors, setErrors] = useState<PreferencesErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const toggleGenre = (genre: string) => {
    setGenres((prev) => {
      const next = prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre];

      if (next.length > 0 && errors.genres) {
        setErrors((prevErr) => ({...prevErr, genres: undefined}));
      }

      return next;
    });
  };

  const handleGetRecommendations = async () => {
    setErrors({});

    const formData: PreferencesFormData = {
      selectedMood,
      freeTime,
      language,
      country,
      era,
      popularity,
      genres,
      movieCount,
    } as unknown as PreferencesFormData;

    const parseResult = preferencesSchema.safeParse(formData);

    if (!parseResult.success) {
      const fieldErrors: PreferencesErrors = {};

      parseResult.error.issues.forEach((issue: any) => {
        const field = issue.path[0] as keyof PreferencesFormData | undefined;
        if (!field) return;
        // only set first message per field
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      });

      setErrors(fieldErrors);
      return;
    }

    const valid = parseResult.data;

    setIsLoading(true);
    try {
      const response = await fetch("https://rec-movie.onrender.com/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mood: valid.selectedMood?.toLowerCase(),
          preferred_length: Number(valid.freeTime),
          language: valid.language === "any" ? null : valid.language,
          country: valid.country === "any" ? null : valid.country,
          era: valid.era === "any" ? null : valid.era,
          popularity:
            valid.popularity === "mainstream"
              ? true
              : valid.popularity === "indie"
              ? false
              : null,
          selected_genres: valid.genres,
          number_recommended: Number(valid.movieCount),
        }),
      });

      const result = await response.json();

      if (result.recommended_movies.length == 0) {
        setIsLoading(false);
        toast.error(
          "Unable to retrieve movies according to your preferences 😞",
          {
            description: (
              <p className="text-red-400">
                Unfortunately your preferences does not match any movies in our
                database 😢
              </p>
            ),
          }
        );
      } else {
        setIsLoading(false);
        // Pass API results to Results page
        navigate("/results", {
          state: {
            preferences: valid,
            movies: result.recommended_movies,
          },
        });
      }
    } catch {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-pink-50 to-blue-50">
      <Navbar />
      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Tell Us What You're Looking For
            </h1>
            <p className="text-gray-600">
              Answer a few questions to get personalized movie recommendations
            </p>
          </div>

          <div className="space-y-6">
            {/* Mood Selection */}
            <div>
              <label
                className="block text-sm font-semibold text-gray-900 mb-3"
                htmlFor="mood"
              >
                How are you feeling right now?
              </label>
              <select
                id="mood"
                value={selectedMood}
                onChange={(e) => {
                  setSelectedMood(e.target.value);
                  setErrors((prev) => ({
                    ...prev,
                    selectedMood: undefined,
                  }));
                }}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select your mood</option>
                {moodOptions.map((mood) => (
                  <option key={mood} value={mood}>
                    {mood}
                  </option>
                ))}
              </select>
              {errors.selectedMood && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.selectedMood}
                </p>
              )}
            </div>

            {/* Free Time */}
            <div>
              <label
                className="block text-sm font-semibold text-gray-900 mb-3"
                htmlFor="freeTime"
              >
                How much free time do you have?
              </label>
              <select
                id="freeTime"
                value={freeTime}
                onChange={(e) => setFreeTime(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
                <option value="120">120 minutes</option>
                <option value="150">150 minutes</option>
                <option value="180">180+ minutes</option>
              </select>
            </div>

            {/* Language Preference */}
            <div>
              <label
                className="block text-sm font-semibold text-gray-900 mb-3"
                htmlFor="language"
              >
                Language Preference
              </label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="any">Any Language</option>
                <option value="fi">Finnish</option>
                <option value="en">English</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="he">Hebrew</option>
                <option value="es">Spanish</option>
                <option value="zh">Chinese</option>
                <option value="ja">Japanese</option>
                <option value="da">Danish</option>
                <option value="ko">Korean</option>
                <option value="pl">Polish</option>
                <option value="sv">Swedish</option>
                <option value="it">Italian</option>
                <option value="bs">Bosnian</option>
                <option value="hi">Hindi</option>
                <option value="ru">Russian</option>
                <option value="no">Norwegian</option>
                <option value="pt">Portuguese</option>
                <option value="nl">Dutch</option>
                <option value="el">Greek</option>
                <option value="cs">Czech</option>
                <option value="bn">Bengali</option>
                <option value="sr">Serbian</option>
                <option value="mn">Mongolian</option>
                <option value="et">Estonian</option>
                <option value="uk">Ukrainian</option>
                <option value="is">Icelandic</option>
                <option value="ca">Catalan</option>
                <option value="ro">Romanian</option>
                <option value="se">Northern Sami</option>
                <option value="th">Thai</option>
                <option value="hu">Hungarian</option>
                <option value="tr">Turkish</option>
                <option value="vi">Vietnamese</option>
                <option value="fa">Persian</option>
                <option value="ar">Arabic</option>
                <option value="tl">Tagalog</option>
                <option value="ta">Tamil</option>
                <option value="kk">Kazakh</option>
              </select>
            </div>

            {/* Country of Production */}
            <div>
              <label
                className="block text-sm font-semibold text-gray-900 mb-3"
                htmlFor="country"
              >
                Country of Production
              </label>
              <select
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="any">Any Country</option>

                <option value="Afghanistan">Afghanistan</option>
                <option value="Albania">Albania</option>
                <option value="Algeria">Algeria</option>
                <option value="American Samoa">American Samoa</option>
                <option value="Andorra">Andorra</option>
                <option value="Angola">Angola</option>
                <option value="Anguilla">Anguilla</option>
                <option value="Antarctica">Antarctica</option>
                <option value="Antigua and Barbuda">Antigua and Barbuda</option>
                <option value="Argentina">Argentina</option>
                <option value="Armenia">Armenia</option>
                <option value="Aruba">Aruba</option>
                <option value="Australia">Australia</option>
                <option value="Austria">Austria</option>
                <option value="Azerbaijan">Azerbaijan</option>
                <option value="Bahamas">Bahamas</option>
                <option value="Bahrain">Bahrain</option>
                <option value="Bangladesh">Bangladesh</option>
                <option value="Barbados">Barbados</option>
                <option value="Belarus">Belarus</option>
                <option value="Belgium">Belgium</option>
                <option value="Belize">Belize</option>
                <option value="Benin">Benin</option>
                <option value="Bermuda">Bermuda</option>
                <option value="Bhutan">Bhutan</option>
                <option value="Bolivia">Bolivia</option>
                <option value="Bosnia and Herzegovina">
                  Bosnia and Herzegovina
                </option>
                <option value="Botswana">Botswana</option>
                <option value="Brazil">Brazil</option>
                <option value="British Indian Ocean Territory">
                  British Indian Ocean Territory
                </option>
                <option value="British Virgin Islands">
                  British Virgin Islands
                </option>
                <option value="Brunei Darussalam">Brunei Darussalam</option>
                <option value="Bulgaria">Bulgaria</option>
                <option value="Burkina Faso">Burkina Faso</option>
                <option value="Burundi">Burundi</option>
                <option value="Cambodia">Cambodia</option>
                <option value="Cameroon">Cameroon</option>
                <option value="Canada">Canada</option>
                <option value="Cape Verde">Cape Verde</option>
                <option value="Cayman Islands">Cayman Islands</option>
                <option value="Central African Republic">
                  Central African Republic
                </option>
                <option value="Chad">Chad</option>
                <option value="Chile">Chile</option>
                <option value="China">China</option>
                <option value="Christmas Island">Christmas Island</option>
                <option value="Colombia">Colombia</option>
                <option value="Comoros">Comoros</option>
                <option value="Congo">Congo</option>
                <option value="Cook Islands">Cook Islands</option>
                <option value="Costa Rica">Costa Rica</option>
                <option value="Cote D'Ivoire">Cote D'Ivoire</option>
                <option value="Croatia">Croatia</option>
                <option value="Cuba">Cuba</option>
                <option value="Cyprus">Cyprus</option>
                <option value="Czech Republic">Czech Republic</option>
                <option value="Czechoslovakia">Czechoslovakia</option>
                <option value="Denmark">Denmark</option>
                <option value="Djibouti">Djibouti</option>
                <option value="Dominica">Dominica</option>
                <option value="Dominican Republic">Dominican Republic</option>
                <option value="East Germany">East Germany</option>
                <option value="Ecuador">Ecuador</option>
                <option value="Egypt">Egypt</option>
                <option value="El Salvador">El Salvador</option>
                <option value="Equatorial Guinea">Equatorial Guinea</option>
                <option value="Eritrea">Eritrea</option>
                <option value="Estonia">Estonia</option>
                <option value="Ethiopia">Ethiopia</option>
                <option value="Faeroe Islands">Faeroe Islands</option>
                <option value="Falkland Islands">Falkland Islands</option>
                <option value="Fiji">Fiji</option>
                <option value="Finland">Finland</option>
                <option value="France">France</option>
                <option value="French Guiana">French Guiana</option>
                <option value="French Polynesia">French Polynesia</option>
                <option value="Gabon">Gabon</option>
                <option value="Gambia">Gambia</option>
                <option value="Georgia">Georgia</option>
                <option value="Germany">Germany</option>
                <option value="Ghana">Ghana</option>
                <option value="Gibraltar">Gibraltar</option>
                <option value="Greece">Greece</option>
                <option value="Greenland">Greenland</option>
                <option value="Grenada">Grenada</option>
                <option value="Guadaloupe">Guadaloupe</option>
                <option value="Guam">Guam</option>
                <option value="Guatemala">Guatemala</option>
                <option value="Guinea">Guinea</option>
                <option value="Guinea-Bissau">Guinea-Bissau</option>
                <option value="Guyana">Guyana</option>
                <option value="Haiti">Haiti</option>
                <option value="Holy See">Holy See</option>
                <option value="Honduras">Honduras</option>
                <option value="Hong Kong">Hong Kong</option>
                <option value="Hungary">Hungary</option>
                <option value="Iceland">Iceland</option>
                <option value="India">India</option>
                <option value="Indonesia">Indonesia</option>
                <option value="Iran">Iran</option>
                <option value="Iraq">Iraq</option>
                <option value="Ireland">Ireland</option>
                <option value="Israel">Israel</option>
                <option value="Italy">Italy</option>
                <option value="Jamaica">Jamaica</option>
                <option value="Japan">Japan</option>
                <option value="Jordan">Jordan</option>
                <option value="Kazakhstan">Kazakhstan</option>
                <option value="Kenya">Kenya</option>
                <option value="Kiribati">Kiribati</option>
                <option value="Kosovo">Kosovo</option>
                <option value="Kuwait">Kuwait</option>
                <option value="Kyrgyz Republic">Kyrgyz Republic</option>
                <option value="Lao People's Democratic Republic">
                  Lao People's Democratic Republic
                </option>
                <option value="Latvia">Latvia</option>
                <option value="Lebanon">Lebanon</option>
                <option value="Lesotho">Lesotho</option>
                <option value="Liberia">Liberia</option>
                <option value="Libyan Arab Jamahiriya">
                  Libyan Arab Jamahiriya
                </option>
                <option value="Liechtenstein">Liechtenstein</option>
                <option value="Lithuania">Lithuania</option>
                <option value="Luxembourg">Luxembourg</option>
                <option value="Macao">Macao</option>
                <option value="Macedonia">Macedonia</option>
                <option value="Madagascar">Madagascar</option>
                <option value="Malawi">Malawi</option>
                <option value="Malaysia">Malaysia</option>
                <option value="Maldives">Maldives</option>
                <option value="Mali">Mali</option>
                <option value="Malta">Malta</option>
                <option value="Marshall Islands">Marshall Islands</option>
                <option value="Martinique">Martinique</option>
                <option value="Mauritania">Mauritania</option>
                <option value="Mauritius">Mauritius</option>
                <option value="Mexico">Mexico</option>
                <option value="Micronesia">Micronesia</option>
                <option value="Moldova">Moldova</option>
                <option value="Monaco">Monaco</option>
                <option value="Mongolia">Mongolia</option>
                <option value="Montenegro">Montenegro</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Morocco">Morocco</option>
                <option value="Mozambique">Mozambique</option>
                <option value="Myanmar">Myanmar</option>
                <option value="Namibia">Namibia</option>
                <option value="Nauru">Nauru</option>
                <option value="Nepal">Nepal</option>
                <option value="Netherlands">Netherlands</option>
                <option value="Netherlands Antilles">
                  Netherlands Antilles
                </option>
                <option value="New Caledonia">New Caledonia</option>
                <option value="New Zealand">New Zealand</option>
                <option value="Nicaragua">Nicaragua</option>
                <option value="Niger">Niger</option>
                <option value="Nigeria">Nigeria</option>
                <option value="Niue">Niue</option>
                <option value="North Korea">North Korea</option>
                <option value="Northern Ireland">Northern Ireland</option>
                <option value="Northern Mariana Islands">
                  Northern Mariana Islands
                </option>
                <option value="Norway">Norway</option>
                <option value="Oman">Oman</option>
                <option value="Pakistan">Pakistan</option>
                <option value="Palau">Palau</option>
                <option value="Palestinian Territory">
                  Palestinian Territory
                </option>
                <option value="Panama">Panama</option>
                <option value="Papua New Guinea">Papua New Guinea</option>
                <option value="Paraguay">Paraguay</option>
                <option value="Peru">Peru</option>
                <option value="Philippines">Philippines</option>
                <option value="Pitcairn Island">Pitcairn Island</option>
                <option value="Poland">Poland</option>
                <option value="Portugal">Portugal</option>
                <option value="Puerto Rico">Puerto Rico</option>
                <option value="Qatar">Qatar</option>
                <option value="Reunion">Reunion</option>
                <option value="Romania">Romania</option>
                <option value="Russia">Russia</option>
                <option value="Rwanda">Rwanda</option>
                <option value="Samoa">Samoa</option>
                <option value="San Marino">San Marino</option>
                <option value="Sao Tome and Principe">
                  Sao Tome and Principe
                </option>
                <option value="Saudi Arabia">Saudi Arabia</option>
                <option value="Senegal">Senegal</option>
                <option value="Serbia">Serbia</option>
                <option value="Serbia and Montenegro">
                  Serbia and Montenegro
                </option>
                <option value="Seychelles">Seychelles</option>
                <option value="Sierra Leone">Sierra Leone</option>
                <option value="Singapore">Singapore</option>
                <option value="Slovakia">Slovakia</option>
                <option value="Slovenia">Slovenia</option>
                <option value="Solomon Islands">Solomon Islands</option>
                <option value="Somalia">Somalia</option>
                <option value="South Africa">South Africa</option>
                <option value="South Georgia and the South Sandwich Islands">
                  South Georgia and the South Sandwich Islands
                </option>
                <option value="South Korea">South Korea</option>
                <option value="South Sudan">South Sudan</option>
                <option value="Soviet Union">Soviet Union</option>
                <option value="Spain">Spain</option>
                <option value="Sri Lanka">Sri Lanka</option>
                <option value="St. Helena">St. Helena</option>
                <option value="St. Kitts and Nevis">St. Kitts and Nevis</option>
                <option value="St. Lucia">St. Lucia</option>
                <option value="St. Pierre and Miquelon">
                  St. Pierre and Miquelon
                </option>
                <option value="St. Vincent and the Grenadines">
                  St. Vincent and the Grenadines
                </option>
                <option value="Sudan">Sudan</option>
                <option value="Suriname">Suriname</option>
                <option value="Svalbard & Jan Mayen Islands">
                  Svalbard & Jan Mayen Islands
                </option>
                <option value="Swaziland">Swaziland</option>
                <option value="Sweden">Sweden</option>
                <option value="Switzerland">Switzerland</option>
                <option value="Syrian Arab Republic">
                  Syrian Arab Republic
                </option>
                <option value="Taiwan">Taiwan</option>
                <option value="Tajikistan">Tajikistan</option>
                <option value="Tanzania">Tanzania</option>
                <option value="Thailand">Thailand</option>
                <option value="Timor-Leste">Timor-Leste</option>
                <option value="Togo">Togo</option>
                <option value="Tokelau">Tokelau</option>
                <option value="Tonga">Tonga</option>
                <option value="Trinidad and Tobago">Trinidad and Tobago</option>
                <option value="Tunisia">Tunisia</option>
                <option value="Turkey">Turkey</option>
                <option value="Turkmenistan">Turkmenistan</option>
                <option value="Turks and Caicos Islands">
                  Turks and Caicos Islands
                </option>
                <option value="Tuvalu">Tuvalu</option>
                <option value="US Virgin Islands">US Virgin Islands</option>
                <option value="Uganda">Uganda</option>
                <option value="Ukraine">Ukraine</option>
                <option value="United Arab Emirates">
                  United Arab Emirates
                </option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="United States Minor Outlying Islands">
                  United States Minor Outlying Islands
                </option>
                <option value="United States of America">
                  United States of America
                </option>
                <option value="Uruguay">Uruguay</option>
                <option value="Uzbekistan">Uzbekistan</option>
                <option value="Vanuatu">Vanuatu</option>
                <option value="Venezuela">Venezuela</option>
                <option value="Vietnam">Vietnam</option>
                <option value="Western Sahara">Western Sahara</option>
                <option value="Yemen">Yemen</option>
                <option value="Yugoslavia">Yugoslavia</option>
                <option value="Zaire">Zaire</option>
                <option value="Zambia">Zambia</option>
                <option value="Zimbabwe">Zimbabwe</option>
              </select>
            </div>

            {/* Movie Era */}
            <div>
              <label
                className="block text-sm font-semibold text-gray-900 mb-3"
                htmlFor="era"
              >
                Movie Era
              </label>
              <select
                id="era"
                value={era}
                onChange={(e) => setEra(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="any">Any Era</option>
                <option value="new">New - 2021 up to now</option>
                <option value="actual">Recent - 1991 up to 2020 </option>
                <option value="old">Old - up to 1990</option>
              </select>
            </div>

            {/* Movie Popularity */}
            <div>
              <label
                className="block text-sm font-semibold text-gray-900 mb-3"
                htmlFor="popularity"
              >
                Movie Popularity
              </label>
              <select
                id="popularity"
                value={popularity}
                onChange={(e) => setPopularity(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="any">Any</option>
                <option value="mainstream">Mainstream</option>
                <option value="indie">Indie</option>
              </select>
            </div>

            {/* Genres */}
            <div>
              <label
                className="block text-sm font-semibold text-gray-900 mb-3"
                htmlFor="genre"
              >
                Genres (select one or more)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {genreOptions.map((genre) => (
                  <label
                    key={genre}
                    htmlFor={genre}
                    className="flex items-center space-x-2 cursor-pointer group"
                  >
                    <input
                      id={genre}
                      type="checkbox"
                      checked={genres.includes(genre)}
                      onChange={() => toggleGenre(genre)}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-purple-600 transition-colors">
                      {genre}
                    </span>
                  </label>
                ))}
              </div>
              {errors.genres && (
                <p className="mt-1 text-xs text-red-500">{errors.genres}</p>
              )}
            </div>

            {/* Number of Movies */}
            <div>
              <label
                className="block text-sm font-semibold text-gray-900 mb-3"
                htmlFor="movieCount"
              >
                How many movies would you like recommended?
              </label>
              <input
                id="movieCount"
                type="number"
                value={movieCount}
                onChange={(e) => {
                  setMovieCount(e.target.value);
                  setErrors((prev) => ({
                    ...prev,
                    movieCount: undefined,
                  }));
                }}
                min={1}
                max={10}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {errors.movieCount && (
                <p className="mt-1 text-xs text-red-500">{errors.movieCount}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleGetRecommendations}
              className="w-full bg-gray-900 text-white py-4 rounded-xl font-semibold hover:bg-gray-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Get Recommendations
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
