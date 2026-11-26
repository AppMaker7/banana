import type { KeyboardEvent } from "react";

type Props = { selectedMuscle: string; onSelect: (muscle: string) => void };

export default function BodyDiagram({ selectedMuscle, onSelect }: Props) {
  const keyChoose = (event: KeyboardEvent<SVGGElement>, muscle: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(muscle);
    }
  };
  const zone = (muscle: string, path: string, label: string) => (
    <g key={label} className={selectedMuscle === muscle ? "body-zone selected" : "body-zone"}
      role="button" tabIndex={0} aria-label={"Select " + muscle + " muscle group"}
      aria-pressed={selectedMuscle === muscle} onClick={() => onSelect(muscle)}
      onKeyDown={(event) => keyChoose(event, muscle)}>
      <title>{muscle}</title><path d={path} />
    </g>
  );

  return (
    <div className="body-diagram-wrap bodygraph-pro">
      <svg className="body-diagram body-diagram-pro" viewBox="-34 0 748 590" role="group" aria-label="Detailed interactive front and back muscle anatomy diagram">
        <defs>
          <linearGradient id="anatomySkin" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F0F1FF" /><stop offset=".55" stopColor="#C9CBE0" /><stop offset="1" stopColor="#AEB4D0" />
          </linearGradient>
          <linearGradient id="anatomyShade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#D9DBED" /><stop offset="1" stopColor="#AEB4CC" />
          </linearGradient>
          <filter id="anatomyGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <g transform="translate(-34 0) scale(1.1 1.42)">
        <g className="anatomy-figure">
          {/* Front silhouette */}
          <g className="body-base">
            <path d="M148 19 Q130 20 127 40 L130 65 Q134 80 150 84 L150 99 Q130 103 111 112 Q91 120 82 145 L66 205 Q62 222 73 231 Q83 237 91 221 L112 166 L119 181 L108 238 Q105 258 113 277 L105 346 Q102 369 116 377 L143 377 Q151 373 150 360 L151 294 L163 250 L175 294 L176 360 Q175 373 184 377 L211 377 Q225 369 222 346 L214 277 Q222 258 219 238 L208 181 L215 166 L236 221 Q244 237 254 231 Q265 222 259 205 L243 145 Q234 120 214 112 Q195 103 175 99 L175 84 Q191 80 195 65 L198 40 Q195 20 177 19Z" />
            <path d="M145 94 Q162 100 180 94 L196 107 L207 139 L199 207 Q193 229 190 247 L180 286 L162 286 L151 247 Q148 229 142 207 L134 139 L124 107Z" />
            <path d="M138 278 Q151 274 162 286 L158 341 L153 365 Q145 377 124 377 L113 371 Q106 363 110 347 L117 300Z" />
            <path d="M181 286 Q193 274 206 278 L227 347 Q231 363 224 371 L213 377 Q192 377 184 365 L179 341Z" />
            <path d="M148 9 Q161 -1 179 8 Q193 17 193 39 L188 67 Q180 83 162 84 Q143 82 135 67 L130 39 Q131 17 148 9Z" />
            {/* Back silhouette */}
            <path d="M478 19 Q460 20 457 40 L460 65 Q464 80 480 84 L480 99 Q460 103 441 112 Q421 120 412 145 L396 205 Q392 222 403 231 Q413 237 421 221 L442 166 L449 181 L438 238 Q435 258 443 277 L435 346 Q432 369 446 377 L473 377 Q481 373 480 360 L481 294 L493 250 L505 294 L506 360 Q505 373 514 377 L541 377 Q555 369 552 346 L544 277 Q552 258 549 238 L538 181 L545 166 L566 221 Q574 237 584 231 Q595 222 589 205 L573 145 Q564 120 544 112 Q525 103 505 99 L505 84 Q521 80 525 65 L528 40 Q525 20 507 19Z" />
            <path d="M475 9 Q488 -1 506 8 Q520 17 520 39 L515 67 Q507 83 489 84 Q470 82 462 67 L457 39 Q458 17 475 9Z" />
          </g>
          {/* Anatomical separations, tendons and muscle contours */}
          <g className="body-anatomy-lines">
            <path d="M162 87 L162 105 M142 105 Q162 114 182 105 M162 105 L162 211 M162 211 L162 285" />
            <path d="M128 113 Q145 123 162 128 Q179 123 196 113 M121 147 Q141 158 160 157 M164 157 Q184 158 203 147" />
            <path d="M146 162 Q162 168 178 162 M145 177 Q162 183 179 177 M148 193 Q162 199 176 193" />
            <path d="M135 211 Q147 227 162 235 Q177 227 189 211 M139 244 Q150 253 162 257 Q174 253 185 244" />
            <path d="M117 286 Q132 297 150 291 M174 291 Q192 297 207 286 M128 301 Q139 322 133 350 M195 301 Q185 322 191 350" />
            <path d="M162 286 L162 374 M489 87 L489 105 M469 113 Q489 125 509 113 M449 145 Q469 155 489 171 Q509 155 529 145" />
            <path d="M448 126 Q466 133 489 151 Q512 133 530 126 M444 159 Q462 177 489 183 Q516 177 534 159" />
            <path d="M447 183 Q462 209 489 220 Q516 209 531 183 M455 225 Q472 241 489 247 Q506 241 523 225" />
            <path d="M449 276 Q468 292 489 290 Q510 292 529 276 M458 300 Q473 315 480 344 M520 300 Q505 315 498 344" />
            <path d="M412 149 Q427 159 442 166 M566 166 Q551 159 536 149 M489 105 L489 285" />
            {/* Forearm, elbow, knee and calf definition */}
            <path d="M85 204 L104 216 M239 216 L258 204 M401 204 L420 216 M575 216 L594 204" />
            <path d="M112 244 Q125 253 137 248 M187 248 Q199 253 212 244 M442 244 Q455 253 467 248 M512 248 Q524 253 537 244" />
          </g>
        </g>
        <g className="body-zones">
          {/* Front chest and shoulders */}
          {zone("Shoulders", "M111 112 Q124 99 143 105 L151 124 Q140 143 119 151 L99 145Z", "front-left-deltoid")}
          {zone("Shoulders", "M181 105 Q200 99 213 112 L225 145 L205 151 Q184 143 173 124Z", "front-right-deltoid")}
          {zone("Chest", "M128 119 Q145 124 160 130 L158 166 Q139 170 119 151Z", "front-left-pectoralis")}
          {zone("Chest", "M164 130 Q179 124 196 119 L205 151 Q185 170 166 166Z", "front-right-pectoralis")}
          {/* Front arms */}
          {zone("Biceps", "M94 150 Q107 145 119 158 L108 205 L91 219 L79 209Z", "front-left-biceps")}
          {zone("Biceps", "M205 158 Q217 145 230 150 L245 209 L233 219 L216 205Z", "front-right-biceps")}
          {zone("Triceps", "M78 207 L92 219 L86 248 L72 225Z", "front-left-triceps")}
          {zone("Triceps", "M232 219 L246 207 L252 225 L238 248Z", "front-right-triceps")}
          {/* Abs and obliques */}
          {zone("Core", "M143 166 Q162 173 181 166 L190 218 Q180 239 162 249 Q144 239 134 218Z", "front-abdominals")}
          {zone("Core", "M119 158 L137 166 L132 215 L145 244 L128 231 L111 185Z", "front-left-oblique")}
          {zone("Core", "M187 166 L205 158 L213 185 L196 231 L179 244 L192 215Z", "front-right-oblique")}
          {/* Front legs */}
          {zone("Legs", "M117 270 Q136 270 158 282 L151 329 L140 354 L115 348 L110 306Z", "front-left-quadriceps")}
          {zone("Legs", "M166 282 Q188 270 207 270 L214 306 L209 348 L184 354 L173 329Z", "front-right-quadriceps")}
          {zone("Legs", "M113 348 L140 354 L146 369 L115 376 L106 365Z", "front-left-calf")}
          {zone("Legs", "M184 354 L211 348 L218 365 L209 376 L178 369Z", "front-right-calf")}
          {/* Back shoulders, arms and upper/lower back */}
          {zone("Shoulders", "M438 112 Q451 99 470 105 L478 124 Q467 143 446 151 L426 145Z", "back-left-deltoid")}
          {zone("Shoulders", "M508 105 Q527 99 540 112 L552 145 L532 151 Q511 143 500 124Z", "back-right-deltoid")}
          {zone("Triceps", "M421 150 Q434 145 446 158 L435 205 L418 219 L406 209Z", "back-left-triceps")}
          {zone("Triceps", "M532 158 Q544 145 557 150 L572 209 L560 219 L543 205Z", "back-right-triceps")}
          {zone("Back", "M459 117 Q475 128 489 151 Q503 128 519 117 L532 159 Q516 180 489 190 Q462 180 446 159Z", "upper-trapezius")}
          {zone("Back", "M447 165 Q466 184 489 192 Q512 184 531 165 L523 230 Q507 250 489 258 Q471 250 455 230Z", "lats-and-mid-back")}
          {zone("Back", "M455 231 Q471 250 489 258 Q507 250 523 231 L526 275 Q507 292 489 292 Q471 292 452 275Z", "lower-back")}
          {/* Rear legs */}
          {zone("Legs", "M446 270 Q466 270 485 282 L478 329 L467 354 L442 348 L439 306Z", "back-left-hamstring")}
          {zone("Legs", "M493 282 Q512 270 532 270 L541 306 L538 348 L513 354 L502 329Z", "back-right-hamstring")}
          {zone("Legs", "M442 348 L467 354 L473 369 L442 376 L433 365Z", "back-left-calf")}
          {zone("Legs", "M513 354 L538 348 L545 365 L536 376 L505 369Z", "back-right-calf")}
        </g>
        </g>
      </svg>
    </div>
  );
}
