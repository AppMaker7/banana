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
      <svg className="body-diagram body-diagram-pro anatomy-realistic" viewBox="0 0 760 570" role="group" aria-label="Interactive front and back muscular anatomy illustration">
        <defs>
          <linearGradient id="anatomySkin" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#E9E5D2" /><stop offset=".48" stopColor="#C9C4AE" /><stop offset="1" stopColor="#8D897B" />
          </linearGradient>
          <linearGradient id="anatomyMuscle" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#D8D2BD" /><stop offset="1" stopColor="#A8A18D" />
          </linearGradient>
          <linearGradient id="anatomyShadow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#777363" /><stop offset=".5" stopColor="#DAD4C0" /><stop offset="1" stopColor="#777363" />
          </linearGradient>
          <filter id="anatomyDepth" x="-30%" y="-20%" width="160%" height="150%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="blur" />
            <feOffset dy="7" result="offset" />
            <feComponentTransfer><feFuncA type="linear" slope=".28" /></feComponentTransfer>
            <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Front and posterior anatomical plates */}
        <g className="anatomy-figure" filter="url(#anatomyDepth)">
          <g className="body-base">
            {/* FRONT: head, neck, torso, arms and legs */}
            <path d="M145 20 C130 20 119 32 119 50 L121 73 C123 91 136 103 151 106 L151 121 C132 124 111 131 96 143 C83 154 77 173 72 194 L54 263 C51 276 57 286 67 289 C77 292 83 285 87 273 L105 214 L112 207 L104 273 C101 289 103 306 111 319 L105 379 C102 400 109 416 125 420 L145 421 C155 419 160 411 159 397 L160 330 L171 330 L172 397 C171 411 177 419 187 421 L207 420 C223 416 230 400 227 379 L221 319 C229 306 231 289 228 273 L220 207 L227 214 L245 273 C249 285 255 292 265 289 C275 286 281 276 278 263 L260 194 C255 173 249 154 236 143 C221 131 200 124 181 121 L181 106 C196 103 209 91 211 73 L213 50 C213 32 202 20 187 20Z" />
            <path d="M150 104 C157 111 175 111 182 104 L188 125 C183 134 178 139 166 139 C154 139 149 134 144 125Z" />
            {/* Front thigh and lower-leg separation */}
            <path d="M111 316 C127 320 145 325 160 329 L157 397 C155 416 143 426 126 421 C111 416 105 401 108 380Z" />
            <path d="M172 329 C187 325 205 320 221 316 L224 380 C227 401 221 416 206 421 C189 426 177 416 175 397Z" />
            <path d="M120 420 C132 425 145 424 156 418 L153 493 C152 508 146 519 136 520 L119 518 C111 514 110 504 112 490Z" />
            <path d="M178 418 C189 424 202 425 214 420 L222 490 C224 504 223 514 215 518 L198 520 C188 519 182 508 181 493Z" />
            {/* BACK: matched proportions */}
            <path d="M525 20 C510 20 499 32 499 50 L501 73 C503 91 516 103 531 106 L531 121 C512 124 491 131 476 143 C463 154 457 173 452 194 L434 263 C431 276 437 286 447 289 C457 292 463 285 467 273 L485 214 L492 207 L484 273 C481 289 483 306 491 319 L485 379 C482 400 489 416 505 420 L525 421 C535 419 540 411 539 397 L540 330 L551 330 L552 397 C551 411 557 419 567 421 L587 420 C603 416 610 400 607 379 L601 319 C609 306 611 289 608 273 L600 207 L607 214 L625 273 C629 285 635 292 645 289 C655 286 661 276 658 263 L640 194 C635 173 629 154 616 143 C601 131 580 124 561 121 L561 106 C576 103 589 91 591 73 L593 50 C593 32 582 20 567 20Z" />
            <path d="M530 104 C537 111 555 111 562 104 L568 125 C563 134 558 139 546 139 C534 139 529 134 524 125Z" />
            <path d="M491 316 C507 320 525 325 540 329 L537 397 C535 416 523 426 506 421 C491 416 485 401 488 380Z" />
            <path d="M552 329 C567 325 585 320 601 316 L604 380 C607 401 601 416 586 421 C569 426 557 416 555 397Z" />
            <path d="M500 420 C512 425 525 424 536 418 L533 493 C532 508 526 519 516 520 L499 518 C491 514 490 504 492 490Z" />
            <path d="M558 418 C569 424 582 425 594 420 L602 490 C604 504 603 514 595 518 L578 520 C568 519 562 508 561 493Z" />
          </g>

          {/* Muscle groups: front */}
          <g className="body-zones">
            {zone("Shoulders","M95 145 C104 132 121 126 139 128 C147 139 146 157 136 170 C123 180 105 179 91 166Z","front-left-deltoid")}
            {zone("Shoulders","M189 128 C207 126 224 132 233 145 L237 166 C223 179 205 180 192 170 C182 157 181 139 189 128Z","front-right-deltoid")}
            {zone("Chest","M139 143 C148 137 158 139 164 145 L163 190 C147 191 130 184 119 172 C120 158 127 148 139 143Z","front-left-pectoral")}
            {zone("Chest","M168 145 C174 139 184 137 193 143 C205 148 212 158 213 172 C202 184 185 191 169 190Z","front-right-pectoral")}
            {zone("Biceps","M88 176 C101 177 113 184 116 197 L104 247 C96 257 84 260 77 249 L81 209Z","front-left-biceps")}
            {zone("Biceps","M208 197 C211 184 223 177 236 176 L243 209 L247 249 C240 260 228 257 220 247Z","front-right-biceps")}
            {zone("Triceps","M76 249 C87 258 98 257 105 247 L101 277 C97 291 88 297 79 289 C72 281 72 263 76 249Z","front-left-triceps")}
            {zone("Triceps","M219 247 C226 257 237 258 248 249 C252 263 252 281 245 289 C236 297 227 291 223 277Z","front-right-triceps")}
            {zone("Core","M143 190 C151 195 159 196 166 196 C173 196 181 195 189 190 L187 270 C180 286 174 294 166 297 C158 294 152 286 145 270Z","front-abdominals")}
            {zone("Core","M119 181 C130 188 139 192 145 190 L145 270 C139 282 132 287 122 281 L111 245Z","front-left-oblique")}
            {zone("Core","M187 190 C193 192 202 188 213 181 L221 245 L210 281 C200 287 193 282 187 270Z","front-right-oblique")}
            {zone("Legs","M111 319 C127 322 145 328 160 332 L156 399 C150 416 137 426 123 418 C111 409 107 393 109 374Z","front-left-quadriceps")}
            {zone("Legs","M172 332 C187 328 205 322 221 319 L223 374 C225 393 221 409 209 418 C195 426 182 416 176 399Z","front-right-quadriceps")}
            {zone("Legs","M112 426 C126 432 141 431 154 425 L150 489 C147 507 138 516 121 513 L114 506Z","front-left-calf")}
            {zone("Legs","M178 425 C191 431 206 432 220 426 L218 506 L211 513 C194 516 185 507 182 489Z","front-right-calf")}

            {/* Back muscle groups */}
            {zone("Shoulders","M455 145 C464 132 481 126 499 128 C507 139 506 157 496 170 C483 180 465 179 451 166Z","back-left-deltoid")}
            {zone("Shoulders","M549 128 C567 126 584 132 593 145 L597 166 C583 179 565 180 552 170 C542 157 541 139 549 128Z","back-right-deltoid")}
            {zone("Triceps","M448 176 C461 177 473 184 476 197 L464 247 C456 257 444 260 437 249 L441 209Z","back-left-triceps")}
            {zone("Triceps","M568 197 C571 184 583 177 596 176 L603 209 L607 249 C600 260 588 257 580 247Z","back-right-triceps")}
            {zone("Back","M507 143 C519 150 533 158 546 167 C559 158 573 150 585 143 L590 180 C578 194 562 202 546 207 C530 202 514 194 502 180Z","trapezius")}
            {zone("Back","M502 181 C516 196 530 205 546 210 C562 205 576 196 590 181 L585 267 C574 282 561 292 546 297 C531 292 518 282 507 267Z","lats-and-mid-back")}
            {zone("Back","M507 267 C519 282 531 291 546 297 C561 291 573 282 585 267 L589 314 C575 325 561 331 546 333 C531 331 517 325 503 314Z","lower-back")}
            {zone("Legs","M491 319 C507 322 525 328 540 332 L536 399 C530 416 517 426 503 418 C491 409 487 393 489 374Z","back-left-hamstring")}
            {zone("Legs","M552 332 C567 328 585 322 601 319 L603 374 C605 393 601 409 589 418 C575 426 562 416 556 399Z","back-right-hamstring")}
            {zone("Legs","M492 426 C506 432 521 431 534 425 L530 489 C527 507 518 516 501 513 L494 506Z","back-left-calf")}
            {zone("Legs","M558 425 C571 431 586 432 600 426 L598 506 L591 513 C574 516 565 507 562 489Z","back-right-calf")}
          </g>
        </g>

        {/* Fine anatomical landmarks, deliberately subtle */}
        <g className="body-anatomy-lines" aria-hidden="true">
          <path d="M166 113 L166 138 M143 139 C151 147 158 150 166 150 C174 150 181 147 189 139 M123 174 C136 187 149 191 163 190 M169 190 C183 191 196 187 209 174" />
          <path d="M146 199 C153 205 159 207 166 207 C173 207 179 205 186 199 M146 218 C153 224 159 226 166 226 C173 226 179 224 186 218 M147 239 C154 245 159 247 166 247 C173 247 178 245 185 239 M149 260 C155 265 160 267 166 267 C172 267 177 265 183 260" />
          <path d="M166 198 L166 289 M112 291 C127 300 143 304 160 304 M172 304 C189 304 205 300 220 291 M133 337 C141 357 139 379 134 397 M199 337 C191 357 193 379 198 397" />
          <path d="M546 113 L546 139 M507 143 C519 155 533 164 546 171 C559 164 573 155 585 143 M507 181 C520 198 532 211 546 218 C560 211 572 198 585 181 M513 231 C524 242 535 248 546 251 C557 248 568 242 579 231 M510 272 C522 284 533 291 546 295 C559 291 570 284 582 272 M546 211 L546 329" />
          <path d="M456 205 L473 218 M596 218 L613 205 M491 291 C505 302 520 307 537 307 M555 307 C572 307 587 302 601 291" />
        </g>
        <g className="body-view-labels">
          <text x="166" y="552">ANTERIOR</text>
          <text x="546" y="552">POSTERIOR</text>
        </g>
      </svg>
      <div className="body-diagram-footer"><span>SELECT A MUSCLE GROUP</span><span className="body-diagram-active"><i /> {selectedMuscle.toUpperCase()} ACTIVE</span></div>
    </div>
  );
}
