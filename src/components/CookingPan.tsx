interface CookingPanProps {
  addedIngredients: string[];
  cookware: string;
  finished?: boolean;
}

export function IngredientDrawing({ name }: { name: string }) {
  const lower = name.toLowerCase();
  if (/tomat|టమా|ಟೊಮಾ|टमाट/.test(lower))
    return (
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <path
          d="M18 11C4 4 3 24 11 29q7 6 14-1C36 16 29 6 18 11"
          fill="#CC4D34"
        />
        <path d="m17 11-6-5 7 2 5-5-1 7 7 1-8 3Z" fill="#668D48" />
        <path
          d="M10 15q-3 5 0 9"
          stroke="#F0A079"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    );
  if (/onion|ఉల్లి|ಈರುಳ್ಳಿ|प्याज़/.test(lower))
    return (
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <path d="M17 6Q2 17 9 28Q18 36 28 25Q34 16 19 6" fill="#D9B9B1" />
        <path
          d="M18 8Q8 20 14 29M19 9q8 13 4 19M18 10v19"
          stroke="#F8E7D8"
          fill="none"
          strokeWidth="1.6"
        />
        <path d="m17 7-1-5m3 5 2-5" stroke="#7F8B57" strokeWidth="2" />
      </svg>
    );
  if (/dal|lentil|rice|పప్పు|బియ్యం|ಬೇಳೆ|ಅಕ್ಕಿ|दाल|चावल/.test(lower))
    return (
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <path d="M5 20h26q-1 12-13 12Q7 31 5 20" fill="#B7C1A2" />
        <ellipse cx="18" cy="20" rx="13" ry="6" fill="#DDC274" />
        <g fill="#F1DB97" stroke="#C0A05A" strokeWidth=".5">
          <ellipse cx="12" cy="18" rx="3" ry="2" />
          <ellipse cx="19" cy="21" rx="3" ry="2" />
          <ellipse cx="24" cy="17" rx="3" ry="2" />
          <ellipse cx="14" cy="23" rx="3" ry="2" />
        </g>
      </svg>
    );
  if (
    /leaf|leaves|coriander|curry|mint|spinach|కొత్తిమీర|ಕರಿಬೇವು|धनिया/.test(
      lower,
    )
  )
    return (
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <path
          d="m17 32 3-22m-2 14L9 14m10 5 9-9"
          fill="none"
          stroke="#507B42"
          strokeWidth="1.6"
        />
        <path
          d="M11 18C-2 15 7 4 12 8C13-1 23 6 18 13q2 9-7 5m13-1c-8-4-2-13 3-10 7-5 11 5 4 7 3 6-4 10-7 3"
          fill="#6E9951"
        />
      </svg>
    );
  if (/chilli|chili|pepper|మిర|ಮೆಣ|मिर्च/.test(lower))
    return (
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <path d="M25 8C23 19 19 27 6 30C18 34 31 23 28 10Z" fill="#CC3E2C" />
        <path
          d="M26 10q-1-7 5-8"
          stroke="#497A5E"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    );
  return (
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <path d="M7 19h22q-2 12-11 12T7 19" fill="#A8B99B" />
      <ellipse cx="18" cy="19" rx="11" ry="4" fill="#DCE3C5" />
      <path
        d="M14 14q-3-4 0-8m7 8q-3-4 0-8"
        stroke="#8D9C7A"
        strokeWidth="1.3"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CookingPan({
  addedIngredients,
  cookware,
  finished,
}: CookingPanProps) {
  const names = addedIngredients.join(" ").toLowerCase();
  const tomato = /tomat|టమా|ಟೊಮಾ|टमाट/.test(names);
  const dal = /dal|lentil|పప్పు|ಬೇಳೆ|दाल/.test(names);
  const rice = /rice|బియ్యం|ಅಕ್ಕಿ|चावल/.test(names);
  const cooker = /cooker|pressure/.test(cookware.toLowerCase());
  const hasFood = addedIngredients.length > 0;
  const onion = /onion|ఉల్లి|ಈರುಳ್ಳಿ|प्याज़/.test(names);
  const leaves = /leaf|leaves|coriander|curry|spinach|mint/.test(names);
  return (
    <div className="illustration">
      <svg
        className={`pan ${cooker ? "is-cooker" : ""}`}
        viewBox="0 0 520 290"
        role="img"
        aria-label={`${cookware} illustration with ${addedIngredients.length ? addedIngredients.join(", ") : "no confirmed ingredients yet"}. Based on your confirmed steps.`}
      >
        <defs>
          <radialGradient id="panInside">
            <stop stopColor="#41504A" />
            <stop offset=".75" stopColor="#24332E" />
            <stop offset="1" stopColor="#15231F" />
          </radialGradient>
          <linearGradient id="panBody" x2="0" y2="1">
            <stop stopColor="#3B4B42" />
            <stop offset="1" stopColor="#12241E" />
          </linearGradient>
          <radialGradient id="stoveShadow">
            <stop stopColor="#223829" stopOpacity=".14" />
            <stop offset="1" stopColor="#223829" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="256" cy="247" rx="190" ry="28" fill="url(#stoveShadow)" />
        {hasFood && !finished && (
          <g>
            <path className="steam" d="M209 61c-11-14 12-22 2-37" />
            <path className="steam s2" d="M255 45c-12-14 13-23 2-39" />
            <path className="steam s3" d="M300 65c-12-16 11-23 2-36" />
          </g>
        )}
        <g>
          <path
            d="M91 168 26 137Q14 131 11 142L8 154Q5 165 18 169L89 191Z"
            fill="#25382D"
            stroke="#11271B"
            strokeWidth="2"
          />
          <path
            d="m408 168 65-31q12-6 15 5l3 12q3 11-10 15l-70 22Z"
            fill="#25382D"
            stroke="#11271B"
            strokeWidth="2"
          />
          <path
            d="m27 149 51 23M431 169l44-19"
            stroke="#6B7762"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
        <path
          d={
            cooker
              ? "M84 151L102 231Q255 279 408 231L425 151Z"
              : "M84 151Q82 229 255 239Q422 233 425 151Z"
          }
          fill="url(#panBody)"
        />
        <ellipse
          cx="255"
          cy="151"
          rx="173"
          ry="78"
          fill="url(#panInside)"
          stroke={cooker ? "#ADB8A8" : "#52614E"}
          strokeWidth={cooker ? 7 : 4}
        />
        <ellipse
          cx="255"
          cy="147"
          rx="156"
          ry="64"
          fill="none"
          stroke="#7B815D"
          strokeWidth="1"
          opacity=".55"
        />
        {hasFood && (
          <ellipse
            cx="255"
            cy="151"
            rx="137"
            ry="51"
            fill="#BFAE5D"
            opacity=".1"
          />
        )}
        {onion && (
          <g>
            <g
              fill="none"
              stroke="#D3AF62"
              strokeWidth="6"
              strokeLinecap="round"
              opacity=".95"
            >
              <path d="M163 134q18-22 35-4M190 164q10-29 38-14M282 125q10-26 35-12M302 163q19-19 35-1M230 111q9-15 24-10M237 176q11-12 24-3" />
              <path d="M136 155q12-15 20-7M337 139q12-9 20 2" strokeWidth="4" />
            </g>
          </g>
        )}
        {leaves && (
          <g fill="#7E9D57" stroke="#AAC07C" strokeWidth=".8">
            <path d="M209 158q-26-22-31-6q8 21 31 6ZM291 149q25-22 32-8q-9 20-32 8ZM257 128q-23-19-28-6q9 18 28 6ZM336 176q-20-17-25-4q7 14 25 4Z" />
          </g>
        )}
        {tomato && (
          <g
            className="pan-food"
            fill="#D8593B"
            stroke="#A93D27"
            strokeWidth="1.4"
          >
            <path d="M176 141q15-24 33-5l-12 25ZM264 159q11-28 32-13l-8 25ZM306 127q17-17 28 0l-16 16ZM232 112q10-20 29-4l-12 17ZM218 175q14-21 31-2l-16 14ZM148 159q8-12 19 0l-7 11Z" />
            <path
              d="m184 141 12 5m77 10 10 4m-43-47 11 2"
              stroke="#EF9C65"
              strokeWidth="3"
            />
          </g>
        )}
        {(dal || rice) && (
          <g className="pan-food">
            <ellipse
              cx="255"
              cy="150"
              rx="145"
              ry="56"
              fill={rice ? "#ECE2BD" : "#D9B45F"}
              fillOpacity=".82"
            />
            <g fill={rice ? "#FFF9DF" : "#EDCE79"}>
              <ellipse cx="212" cy="140" rx="6" ry="3" />
              <ellipse cx="273" cy="163" rx="5" ry="3" />
              <ellipse cx="306" cy="137" rx="6" ry="3" />
              <ellipse cx="235" cy="177" rx="6" ry="3" />
            </g>
            <path
              d="M195 148q20 16 40-2m35-12q17 15 31 1"
              stroke="#6E8C45"
              fill="none"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </g>
        )}
      </svg>
      <span className="pan-note">
        <i />
        Illustration follows your confirmed steps
      </span>
    </div>
  );
}
