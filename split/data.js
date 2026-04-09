// SproutLab v2.38 — Pure Data Constants
// Auto-extracted by architecture split. Do not edit line order.
// Rebuild: bash build.sh > index.html

// @@DATA_BLOCK_1_START@@ EVIDENCE_PATTERNS + KEYWORD_TO_MILESTONE

// ─── EVIDENCE PATTERNS (500+) ───
// Each: { keywords[], milestone, domain, confidence, context, exclude?[], require?[], notes? }
const EVIDENCE_PATTERNS = [
  // ═══════════════════════════════════════
  // MOTOR: GROSS MOTOR
  // ═══════════════════════════════════════

  // ── Sitting ──
  { keywords: ['sit', 'sitting', 'sat'],
    milestone: 'sit', domain: 'motor', confidence: 'high', context: 'independent_unsupported',
    exclude: ['high chair', 'car seat', 'bouncer', 'supported', 'held', 'propped', 'lap', 'bumbo', 'walker seat'] },
  { keywords: ['sit', 'sitting', 'sat'],
    milestone: 'sit', domain: 'motor', confidence: 'medium', context: 'supported',
    require: ['high chair', 'support', 'propped', 'held', 'bouncer', 'help', 'lap', 'bumbo', 'pillow'] },
  { keywords: ['tripod sit', 'tripod sitting'],
    milestone: 'sit', domain: 'motor', confidence: 'medium', context: 'tripod' },
  { keywords: ['baithna', 'baith', 'baithi', 'baithe'],
    milestone: 'sit', domain: 'motor', confidence: 'high', context: 'hindi_sit',
    exclude: ['chair', 'gadi', 'kursi'] },

  // ── Rolling ──
  { keywords: ['roll', 'rolled', 'rolling'],
    milestone: 'roll', domain: 'motor', confidence: 'high', context: 'independent',
    exclude: ['ball', 'toy', 'wheel', 'roti', 'chapati', 'dough', 'rolling pin'] },
  { keywords: ['tummy to back', 'back to tummy', 'front to back', 'back to front'],
    milestone: 'roll', domain: 'motor', confidence: 'high', context: 'directional_roll' },
  { keywords: ['lotna', 'lot gayi', 'lot gaya', 'palat gayi', 'palat gaya', 'palti'],
    milestone: 'roll', domain: 'motor', confidence: 'high', context: 'hindi_roll' },

  // ── Crawling ──
  { keywords: ['crawl', 'crawled', 'crawling', 'commando', 'army crawl', 'scooting', 'scoot', 'belly crawl'],
    milestone: 'crawl', domain: 'motor', confidence: 'high', context: 'locomotion' },
  { keywords: ['on all fours', 'hands and knees', 'rocking on knees', 'rocking back and forth'],
    milestone: 'crawl', domain: 'motor', confidence: 'medium', context: 'pre_crawl' },
  { keywords: ['moving forward', 'moved across', 'got to the', 'reached the toy'],
    milestone: 'crawl', domain: 'motor', confidence: 'medium', context: 'inferred_locomotion',
    exclude: ['walk', 'step', 'cruise'] },
  { keywords: ['ghutno pe', 'ghutne', 'ghisakte', 'ghisak', 'rangna', 'rengte'],
    milestone: 'crawl', domain: 'motor', confidence: 'high', context: 'hindi_crawl' },

  // ── Pull to stand ──
  { keywords: ['pull up', 'pulled up', 'pulling up', 'pull to stand', 'pulled to stand', 'pulls to stand'],
    milestone: 'pull_to_stand', domain: 'motor', confidence: 'high', context: 'independent' },
  { keywords: ['standing', 'stood', 'stands'],
    milestone: 'pull_to_stand', domain: 'motor', confidence: 'medium', context: 'holding_furniture',
    require: ['holding', 'furniture', 'table', 'couch', 'sofa', 'chair', 'rail', 'crib', 'cot', 'bed', 'support'] },
  { keywords: ['standing', 'stood', 'stands'],
    milestone: 'pull_to_stand', domain: 'motor', confidence: 'high', context: 'independent_standing',
    exclude: ['holding', 'furniture', 'table', 'couch', 'sofa', 'chair', 'rail', 'crib', 'cot', 'support', 'help', 'hand'] },
  { keywords: ['khada', 'khadi', 'khade', 'uth gayi', 'uth gaya', 'uthna'],
    milestone: 'pull_to_stand', domain: 'motor', confidence: 'high', context: 'hindi_stand' },

  // ── Cruising ──
  { keywords: ['cruising', 'cruise', 'cruised', 'walking along', 'walks along', 'stepping along'],
    milestone: 'cruise', domain: 'motor', confidence: 'high', context: 'along_furniture' },
  { keywords: ['sideway', 'sideways', 'side step', 'side-step'],
    milestone: 'cruise', domain: 'motor', confidence: 'medium', context: 'lateral_step',
    require: ['furniture', 'table', 'couch', 'sofa', 'along', 'holding', 'stand'] },

  // ── Walking ──
  { keywords: ['walk', 'walked', 'walking', 'steps', 'first steps', 'took steps'],
    milestone: 'walk', domain: 'motor', confidence: 'high', context: 'independent',
    exclude: ['supported', 'holding', 'walker', 'hand', 'help', 'along', 'push'] },
  { keywords: ['walk', 'walked', 'walking'],
    milestone: 'walk', domain: 'motor', confidence: 'medium', context: 'supported',
    require: ['holding hand', 'walker', 'push toy', 'supported', 'with help', 'holding on'] },
  { keywords: ['chalna', 'chal', 'chali', 'chale', 'chalte', 'chal gayi', 'chal diye'],
    milestone: 'walk', domain: 'motor', confidence: 'high', context: 'hindi_walk',
    exclude: ['sahara', 'pakad'] },

  // ── Head control ──
  { keywords: ['head up', 'head control', 'lifted head', 'head steady', 'holds head'],
    milestone: 'head_control', domain: 'motor', confidence: 'high', context: 'prone_head_lift' },
  { keywords: ['neck strong', 'neck steady', 'no head lag', 'head lag'],
    milestone: 'head_control', domain: 'motor', confidence: 'medium', context: 'neck_control' },

  // ── Climbing ──
  { keywords: ['climb', 'climbed', 'climbing', 'climbs'],
    milestone: 'climb', domain: 'motor', confidence: 'high', context: 'gross_motor_climb',
    exclude: ['tree'] },
  { keywords: ['up the stairs', 'up stairs', 'climbing stairs', 'step up'],
    milestone: 'climb', domain: 'motor', confidence: 'high', context: 'stair_climb' },

  // ── Kicking ──
  { keywords: ['kick', 'kicked', 'kicking', 'kicks'],
    milestone: 'kick', domain: 'motor', confidence: 'high', context: 'leg_motor',
    exclude: ['ball kick'] },
  { keywords: ['kick ball', 'kicked ball', 'kicked the ball', 'kicking ball'],
    milestone: 'kick', domain: 'motor', confidence: 'high', context: 'ball_kick' },

  // ── Bouncing / jumping ──
  { keywords: ['bounce', 'bounced', 'bouncing', 'jump', 'jumped', 'jumping'],
    milestone: 'bounce', domain: 'motor', confidence: 'high', context: 'leg_strength',
    exclude: ['bouncer', 'ball'] },

  // ═══════════════════════════════════════
  // MOTOR: FINE MOTOR
  // ═══════════════════════════════════════

  // ── Grasp ──
  { keywords: ['grab', 'grabbed', 'grabbing', 'grasp', 'grasped', 'gripping', 'grip', 'held object', 'holding toy', 'pick up', 'picked up', 'picks up'],
    milestone: 'grasp', domain: 'motor', confidence: 'medium', context: 'palmar',
    exclude: ['pincer', 'thumb and finger', 'tiny', 'small piece', 'cheerio', 'puff'] },
  { keywords: ['raking', 'raking grasp', 'whole hand', 'fist grab', 'palmar grasp'],
    milestone: 'grasp', domain: 'motor', confidence: 'high', context: 'palmar_confirmed' },
  { keywords: ['pakadna', 'pakad', 'pakdi', 'pakda', 'pakadte'],
    milestone: 'grasp', domain: 'motor', confidence: 'medium', context: 'hindi_grasp' },

  // ── Pincer grasp ──
  { keywords: ['pincer', 'thumb and finger', 'thumb finger', 'tiny piece', 'small piece'],
    milestone: 'pincer', domain: 'motor', confidence: 'high', context: 'pincer_grasp' },
  { keywords: ['cheerio', 'puff', 'pea', 'raisin', 'crumb', 'grain', 'small food'],
    milestone: 'pincer', domain: 'motor', confidence: 'high', context: 'small_object_pickup' },
  { keywords: ['two finger', 'fingertip', 'finger tip', 'picked up tiny'],
    milestone: 'pincer', domain: 'motor', confidence: 'high', context: 'precision_grasp' },

  // ── Transfer ──
  { keywords: ['transfer', 'transferred', 'passed', 'swapped', 'hand to hand', 'one hand to other', 'both hands'],
    milestone: 'transfer', domain: 'motor', confidence: 'high', context: 'bilateral' },
  { keywords: ['switched hand', 'other hand', 'passed toy'],
    milestone: 'transfer', domain: 'motor', confidence: 'high', context: 'object_transfer' },

  // ── Stacking ──
  { keywords: ['stack', 'stacked', 'stacking', 'tower', 'block on block', 'built tower', 'building blocks'],
    milestone: 'stack', domain: 'motor', confidence: 'high', context: 'block_stacking' },
  { keywords: ['put on top', 'placed on top', 'balanced'],
    milestone: 'stack', domain: 'motor', confidence: 'medium', context: 'stacking_attempt' },

  // ── Banging ──
  { keywords: ['bang', 'banging', 'banged', 'hitting together', 'clinking', 'knocked', 'smashing'],
    milestone: 'bang', domain: 'motor', confidence: 'high', context: 'object_banging',
    exclude: ['head', 'wall'] },
  { keywords: ['two objects', 'toy together', 'toys together', 'spoons together'],
    milestone: 'bang', domain: 'motor', confidence: 'high', context: 'bilateral_bang' },

  // ── Self-feeding ──
  { keywords: ['finger food', 'finger feeding', 'self feeding', 'self-feeding', 'fed himself', 'fed herself', 'ate by herself', 'ate by himself', 'picking up food'],
    milestone: 'finger_feed', domain: 'motor', confidence: 'high', context: 'self_feeding' },
  { keywords: ['hand to mouth', 'mouth with hand', 'eating by self', 'eating on own'],
    milestone: 'finger_feed', domain: 'motor', confidence: 'high', context: 'hand_mouth_coord' },
  { keywords: ['khud se khaya', 'khud khaya', 'apne aap khaya', 'haath se khaya'],
    milestone: 'finger_feed', domain: 'motor', confidence: 'high', context: 'hindi_self_feed' },

  // ── Spoon use ──
  { keywords: ['spoon', 'scooped', 'spooning', 'using spoon', 'with spoon', 'spoon to mouth'],
    milestone: 'spoon', domain: 'motor', confidence: 'high', context: 'utensil_use' },
  { keywords: ['fork', 'using fork', 'stabbed food'],
    milestone: 'spoon', domain: 'motor', confidence: 'high', context: 'fork_use' },
  { keywords: ['chamach', 'chamach se', 'chammach'],
    milestone: 'spoon', domain: 'motor', confidence: 'high', context: 'hindi_spoon' },

  // ── Cup drinking ──
  { keywords: ['cup', 'drinking cup', 'sippy', 'sippy cup', 'straw', 'open cup', 'drank from cup'],
    milestone: 'cup_drink', domain: 'motor', confidence: 'high', context: 'cup_drinking' },
  { keywords: ['gilass', 'glass se', 'paani piya cup'],
    milestone: 'cup_drink', domain: 'motor', confidence: 'high', context: 'hindi_cup' },

  // ── Throwing ──
  { keywords: ['throw', 'threw', 'throwing', 'tossed', 'toss', 'flung', 'launched'],
    milestone: 'throw', domain: 'motor', confidence: 'high', context: 'throwing',
    exclude: ['tantrum', 'angry'] },

  // ── Dropping ──
  { keywords: ['drop', 'dropped', 'dropping', 'lets go', 'release'],
    milestone: 'release', domain: 'motor', confidence: 'medium', context: 'voluntary_release',
    exclude: ['accidentally', 'oops'] },

  // ── Clapping (motor) ──
  { keywords: ['clap', 'clapped', 'clapping', 'claps hands'],
    milestone: 'clap', domain: 'motor', confidence: 'high', context: 'bilateral_coordination' },

  // ── Pointing (motor) ──
  { keywords: ['point', 'pointed', 'pointing', 'index finger', 'finger point'],
    milestone: 'point', domain: 'motor', confidence: 'high', context: 'fine_motor_point',
    exclude: ['i pointed', 'we pointed', 'parent pointed'] },

  // ── Drawing / scribbling ──
  { keywords: ['scribbl', 'crayon', 'draw', 'drew', 'drawing', 'pencil', 'marker', 'chalk'],
    milestone: 'scribble', domain: 'motor', confidence: 'high', context: 'pre_writing' },

  // ── Page turning ──
  { keywords: ['turned page', 'page turning', 'turn page', 'flipped page', 'board book page'],
    milestone: 'page_turn', domain: 'motor', confidence: 'high', context: 'fine_motor_page' },

  // ── Lid / container ──
  { keywords: ['opened lid', 'open lid', 'close lid', 'opened box', 'opened container', 'put lid on', 'took lid off'],
    milestone: 'container', domain: 'motor', confidence: 'high', context: 'container_manipulation' },

  // ── Nesting / inserting ──
  { keywords: ['nesting', 'nested', 'stacking cups', 'cup in cup', 'put inside', 'insert'],
    milestone: 'nesting', domain: 'motor', confidence: 'high', context: 'spatial_motor' },

  // ═══════════════════════════════════════
  // LANGUAGE: EXPRESSIVE
  // ═══════════════════════════════════════

  // ── Cooing ──
  { keywords: ['coo', 'cooing', 'cooed', 'ooh', 'aah', 'gurgle', 'gurgling'],
    milestone: 'coo', domain: 'language', confidence: 'high', context: 'early_vocalization' },

  // ── Babbling ──
  { keywords: ['babbl', 'ba-ba', 'da-da', 'ma-ma', 'ga-ga', 'consonant', 'babababa', 'mamama', 'dadada', 'gagaga'],
    milestone: 'babble', domain: 'language', confidence: 'high', context: 'canonical_babbling' },
  { keywords: ['sound', 'vocal', 'making noise', 'loud sounds', 'squealing', 'squeal', 'shriek'],
    milestone: 'babble', domain: 'language', confidence: 'medium', context: 'vocalization' },
  { keywords: ['jabbering', 'jabber', 'chattering', 'chatter', 'talking away'],
    milestone: 'babble', domain: 'language', confidence: 'high', context: 'variegated_babbling' },

  // ── Mama/Dada (non-specific) ──
  { keywords: ['mama', 'dada', 'papa', 'mamma', 'mumma'],
    milestone: 'mama_dada', domain: 'language', confidence: 'medium', context: 'non_specific' },

  // ── Mama/Dada (with meaning) ──
  { keywords: ['mama', 'dada', 'papa', 'mamma', 'mumma'],
    milestone: 'mama_dada_meaning', domain: 'language', confidence: 'high', context: 'directed_at_parent',
    require: ['when i', 'when she saw', 'looking at', 'pointed at', 'reached for', 'called', 'saw me', 'entered', 'came in', 'looking at me'] },

  // ── First words ──
  { keywords: ['said', 'says', 'word', 'called me', 'first word', 'new word'],
    milestone: 'first_word', domain: 'language', confidence: 'high', context: 'meaningful_word',
    require: ['mama', 'dada', 'papa', 'hi', 'bye', 'no', 'yes', 'haan', 'nahi', 'ball', 'dog', 'cat', 'milk', 'water', 'paani', 'more', 'done', 'up', 'down'] },
  { keywords: ['word count', 'words now', 'vocabulary', 'knows words'],
    milestone: 'first_word', domain: 'language', confidence: 'high', context: 'word_count' },
  { keywords: ['bola', 'boli', 'bol rahi', 'bol raha', 'pehla shabd', 'shabd'],
    milestone: 'first_word', domain: 'language', confidence: 'high', context: 'hindi_word' },

  // ── Two-word phrases ──
  { keywords: ['two word', '2 word', 'two-word', 'short sentence', 'phrase', 'put words together'],
    milestone: 'two_word', domain: 'language', confidence: 'high', context: 'word_combination' },

  // ── Responds to name ──
  { keywords: ['turned when called', 'looked when called', 'responds to name', 'turned when i said', 'looked up when'],
    milestone: 'respond_name', domain: 'language', confidence: 'high', context: 'name_recognition' },
  { keywords: ['name', 'respond'],
    milestone: 'respond_name', domain: 'language', confidence: 'medium', context: 'name_recognition_general',
    require: ['name', 'called', 'hearing', 'turned'] },
  { keywords: ['naam sun', 'naam pe', 'naam bulaya', 'mudh gayi', 'mud gayi'],
    milestone: 'respond_name', domain: 'language', confidence: 'high', context: 'hindi_name_response' },

  // ── Understands words ──
  { keywords: ['understands', 'understood', 'knows what', 'looked at the', 'pointed to the', 'found the', 'where is'],
    milestone: 'understand_words', domain: 'language', confidence: 'high', context: 'receptive_language' },
  { keywords: ['follows command', 'follows instruction', 'did what i asked', 'listened', 'obeyed'],
    milestone: 'understand_words', domain: 'language', confidence: 'high', context: 'comprehension' },
  { keywords: ['samajhti', 'samajhta', 'samajh gayi', 'samajh gaya', 'pata hai'],
    milestone: 'understand_words', domain: 'language', confidence: 'high', context: 'hindi_understand' },

  // ── Pointing (language) ──
  { keywords: ['point', 'pointed', 'pointing', 'index finger'],
    milestone: 'point', domain: 'language', confidence: 'high', context: 'proto_declarative',
    exclude: ['i pointed', 'we pointed', 'parent pointed'] },
  { keywords: ['showed me', 'show me', 'look at that', 'pointed at'],
    milestone: 'point', domain: 'language', confidence: 'high', context: 'joint_attention' },

  // ── Gestures ──
  { keywords: ['gesture', 'gesturing', 'sign', 'signed', 'sign language', 'baby sign'],
    milestone: 'gesture', domain: 'language', confidence: 'high', context: 'gestural_communication' },
  { keywords: ['shakes head', 'shook head', 'nodded', 'nods'],
    milestone: 'gesture', domain: 'language', confidence: 'high', context: 'head_gesture' },

  // ── Singing / rhyme ──
  { keywords: ['sang', 'singing', 'hums', 'humming', 'rhyme', 'nursery rhyme'],
    milestone: 'sing', domain: 'language', confidence: 'medium', context: 'musical_language' },

  // ═══════════════════════════════════════
  // SOCIAL
  // ═══════════════════════════════════════

  // ── Social smile ──
  { keywords: ['social smile', 'smiled at me', 'smiled at', 'smiles at people', 'smiled when'],
    milestone: 'social_smile', domain: 'social', confidence: 'high', context: 'social_response' },
  { keywords: ['laugh', 'laughed', 'laughing', 'giggle', 'giggled', 'giggling', 'chuckle'],
    milestone: 'social_smile', domain: 'social', confidence: 'high', context: 'social_laughter' },
  { keywords: ['hasi', 'hans', 'hansi', 'muskurai', 'muskuraya'],
    milestone: 'social_smile', domain: 'social', confidence: 'high', context: 'hindi_smile' },

  // ── Waving ──
  { keywords: ['wave', 'waved', 'waving', 'bye-bye', 'bye bye', 'buh-bye', 'ta-ta'],
    milestone: 'wave', domain: 'social', confidence: 'high', context: 'social_gesture' },
  { keywords: ['tata', 'ta ta', 'bye kiya', 'haath hilaya'],
    milestone: 'wave', domain: 'social', confidence: 'high', context: 'hindi_wave' },

  // ── Clapping (social) ──
  { keywords: ['clap', 'clapped', 'clapping', 'patty cake', 'pattycake', 'pat-a-cake'],
    milestone: 'clap', domain: 'social', confidence: 'high', context: 'imitation' },
  { keywords: ['taali', 'tali', 'taali bajayi'],
    milestone: 'clap', domain: 'social', confidence: 'high', context: 'hindi_clap' },

  // ── Peek-a-boo ──
  { keywords: ['peek', 'peekaboo', 'peek-a-boo', 'hiding face', 'hid face'],
    milestone: 'object_permanence', domain: 'social', confidence: 'medium', context: 'social_game' },

  // ── Stranger anxiety / attachment ──
  { keywords: ['stranger', 'cried when', 'scared of', 'clingy', 'clung to', 'only wants me', 'separation', 'stranger anxiety'],
    milestone: 'separation_anxiety', domain: 'social', confidence: 'high', context: 'attachment_behavior' },
  { keywords: ['won\'t go to', 'cries when i leave', 'doesn\'t want', 'only mama', 'only papa'],
    milestone: 'separation_anxiety', domain: 'social', confidence: 'high', context: 'separation_distress' },
  { keywords: ['ajnabi', 'dar gayi', 'dar gaya', 'chipak gayi', 'chipak gaya', 'rone lagi'],
    milestone: 'separation_anxiety', domain: 'social', confidence: 'high', context: 'hindi_stranger' },

  // ── Imitation ──
  { keywords: ['copied', 'imitat', 'did what i did', 'followed my', 'tried to copy', 'mimick', 'mimic'],
    milestone: 'imitation', domain: 'social', confidence: 'high', context: 'social_learning' },
  { keywords: ['copied sound', 'repeated after', 'does same', 'tries to do what'],
    milestone: 'imitation', domain: 'social', confidence: 'high', context: 'deferred_imitation' },
  { keywords: ['nakal', 'copy kiya', 'copy karti', 'wahi kiya', 'dekh ke kiya'],
    milestone: 'imitation', domain: 'social', confidence: 'high', context: 'hindi_imitation' },

  // ── Sharing ──
  { keywords: ['shared', 'sharing', 'gave me', 'offered', 'handed to', 'gives toy', 'gave toy'],
    milestone: 'sharing', domain: 'social', confidence: 'high', context: 'prosocial',
    exclude: ['food', 'meal'] },

  // ── Joint attention ──
  { keywords: ['showed me', 'look at this', 'brought to show', 'wanted me to see'],
    milestone: 'joint_attention', domain: 'social', confidence: 'high', context: 'shared_attention' },
  { keywords: ['follows my gaze', 'looked where i pointed', 'followed my finger'],
    milestone: 'joint_attention', domain: 'social', confidence: 'high', context: 'gaze_following' },

  // ── Sleeps independently (social) ──
  { keywords: ['slept alone', 'sleeps independently', 'self soothe', 'self-soothe', 'fell asleep alone', 'put herself to sleep'],
    milestone: 'independent_sleep', domain: 'social', confidence: 'high', context: 'self_regulation' },
  { keywords: ['khud so gayi', 'akele soyi', 'apne aap soyi'],
    milestone: 'independent_sleep', domain: 'social', confidence: 'high', context: 'hindi_independent_sleep' },

  // ── Plays with others ──
  { keywords: ['played with', 'playing together', 'with other kids', 'with other bab', 'playtime with'],
    milestone: 'social_play', domain: 'social', confidence: 'high', context: 'peer_interaction',
    exclude: ['alone', 'by herself', 'by himself'] },

  // ── Affection ──
  { keywords: ['hug', 'hugged', 'hugging', 'cuddle', 'cuddled', 'kiss', 'kissed', 'nuzzle'],
    milestone: 'affection', domain: 'social', confidence: 'high', context: 'expressing_affection' },
  { keywords: ['pyaar', 'gale lagaya', 'pappi', 'chummi', 'lipti'],
    milestone: 'affection', domain: 'social', confidence: 'high', context: 'hindi_affection' },

  // ═══════════════════════════════════════
  // COGNITIVE
  // ═══════════════════════════════════════

  // ── Object permanence ──
  { keywords: ['found hidden', 'looked for', 'searched', 'where did', 'lifted cloth', 'uncovered', 'found under'],
    milestone: 'object_permanence', domain: 'cognitive', confidence: 'high', context: 'object_search' },
  { keywords: ['looked for toy', 'searched for', 'knew where', 'remembered where'],
    milestone: 'object_permanence', domain: 'cognitive', confidence: 'high', context: 'object_memory' },

  // ── Cause and effect ──
  { keywords: ['pressed button', 'push button', 'figured out', 'learned that', 'realized', 'knew that', 'cause and effect'],
    milestone: 'cause_effect', domain: 'cognitive', confidence: 'high', context: 'causal_reasoning' },
  { keywords: ['if i do', 'when she does', 'makes it', 'to make', 'to get'],
    milestone: 'cause_effect', domain: 'cognitive', confidence: 'medium', context: 'intentional_action' },
  { keywords: ['light switch', 'switch on', 'switch off', 'turn on', 'turn off'],
    milestone: 'cause_effect', domain: 'cognitive', confidence: 'high', context: 'switch_operation' },

  // ── Problem solving ──
  { keywords: ['figured out', 'problem solv', 'worked out', 'found a way', 'tried different'],
    milestone: 'problem_solve', domain: 'cognitive', confidence: 'high', context: 'problem_solving' },
  { keywords: ['moved obstacle', 'pushed aside', 'pulled blanket', 'used tool', 'used stick'],
    milestone: 'problem_solve', domain: 'cognitive', confidence: 'high', context: 'tool_use' },

  // ── Shape / colour recognition ──
  { keywords: ['shape', 'circle', 'square', 'triangle', 'star shape', 'shape sorter'],
    milestone: 'shape_sort', domain: 'cognitive', confidence: 'high', context: 'shape_recognition' },
  { keywords: ['colour', 'color', 'red', 'blue', 'green', 'yellow'],
    milestone: 'color_recog', domain: 'cognitive', confidence: 'medium', context: 'color_awareness',
    require: ['knows', 'identified', 'pointed', 'said', 'named', 'picked'] },

  // ── Memory / anticipation ──
  { keywords: ['remembered', 'anticipat', 'expected', 'knew what was coming', 'excited before'],
    milestone: 'memory', domain: 'cognitive', confidence: 'high', context: 'anticipatory_behavior' },
  { keywords: ['looks for spoon', 'expects food', 'reaches when sees bottle', 'knows routine'],
    milestone: 'memory', domain: 'cognitive', confidence: 'high', context: 'routine_memory' },

  // ── Exploration / curiosity ──
  { keywords: ['explored', 'exploring', 'investigated', 'curious', 'curiosity', 'examined', 'inspected'],
    milestone: 'explore', domain: 'cognitive', confidence: 'medium', context: 'exploratory_behavior' },
  { keywords: ['took apart', 'opened', 'pulled apart', 'disassembled', 'emptied'],
    milestone: 'explore', domain: 'cognitive', confidence: 'high', context: 'deconstructive_play' },

  // ── Pretend play ──
  { keywords: ['pretend', 'pretended', 'pretending', 'make believe', 'imaginary', 'pretend play'],
    milestone: 'pretend_play', domain: 'cognitive', confidence: 'high', context: 'symbolic_play' },
  { keywords: ['fed doll', 'fed teddy', 'phone to ear', 'pretend cook', 'pretend eat', 'tea party'],
    milestone: 'pretend_play', domain: 'cognitive', confidence: 'high', context: 'functional_play' },

  // ── Sorting / grouping ──
  { keywords: ['sorted', 'sorting', 'grouped', 'grouping', 'put together', 'matched'],
    milestone: 'sorting', domain: 'cognitive', confidence: 'high', context: 'categorization' },

  // ═══════════════════════════════════════
  // SENSORY
  // ═══════════════════════════════════════

  // ── Texture / tactile exploration ──
  { keywords: ['texture', 'squishy', 'slimy', 'gooey', 'sand', 'mud', 'clay', 'dough', 'paint', 'foam', 'rice play', 'sensory bin', 'sensory play', 'messy play'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'high', context: 'tactile_exploration' },
  { keywords: ['touch', 'touched', 'feeling', 'felt', 'rubbed', 'stroked', 'poked'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'medium', context: 'tactile_general' },
  { keywords: ['atta', 'aata play', 'rangoli', 'haldi', 'mehendi play'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'high', context: 'hindi_tactile' },

  // ── Water play ──
  { keywords: ['water play', 'splash', 'splashing', 'bath play', 'pouring water', 'scooping water', 'water table'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'high', context: 'water_play' },
  { keywords: ['paani khel', 'paani se kheli', 'nahate hue khela'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'high', context: 'hindi_water' },

  // ── Sound / auditory exploration ──
  { keywords: ['music', 'musical', 'rhythm', 'drum', 'rattle', 'shaker', 'bells', 'xylophone', 'singing', 'danced', 'dancing'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'high', context: 'auditory_exploration' },
  { keywords: ['listened', 'heard', 'sound', 'turned to sound', 'startled by'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'medium', context: 'auditory_response' },
  { keywords: ['dhol', 'ghanti', 'jhankar', 'tabla', 'gaana', 'geet'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'high', context: 'hindi_auditory' },

  // ── Visual exploration ──
  { keywords: ['mirror', 'reflection', 'watched', 'stared at', 'tracking', 'followed with eyes', 'bright colors', 'light play'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'medium', context: 'visual_exploration' },
  { keywords: ['high contrast', 'black and white', 'colorful', 'bright toy', 'light up'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'medium', context: 'visual_stimulation' },

  // ── Vestibular / proprioceptive ──
  { keywords: ['swing', 'swinging', 'rocking', 'bouncing', 'spinning', 'upside down', 'held up high', 'airplane'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'high', context: 'vestibular' },

  // ── Mouthing (oral sensory) ──
  { keywords: ['mouthing', 'mouths', 'chew', 'chewing', 'gnawing', 'teether', 'bit', 'biting'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'medium', context: 'oral_sensory',
    exclude: ['food', 'meal', 'eat'] },

  // ── Temperature awareness ──
  { keywords: ['cold water', 'warm water', 'hot', 'cold', 'ice'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'medium', context: 'temperature_awareness',
    require: ['felt', 'reacted', 'touched', 'sensory', 'play', 'explore'] },

  // ═══════════════════════════════════════
  // CROSS-CUTTING: ACTIVITY TYPES
  // ═══════════════════════════════════════

  // ── Tummy time ──
  { keywords: ['tummy time', 'tummy-time', 'on tummy', 'on belly', 'prone play', 'belly time', 'pet pe'],
    milestone: 'tummy_time', domain: 'motor', confidence: 'high', context: 'prone_play' },

  // ── Book / reading (language) ──
  { keywords: ['book', 'read', 'reading', 'story', 'storytime', 'picture book', 'board book', 'library'],
    milestone: 'book_engagement', domain: 'language', confidence: 'high', context: 'literacy_exposure' },
  { keywords: ['kitaab', 'kahani', 'kahani sunai'],
    milestone: 'book_engagement', domain: 'language', confidence: 'high', context: 'hindi_book' },

  // ── Book / reading (cognitive) ──
  { keywords: ['book', 'read', 'reading', 'story', 'pointed at picture', 'turned page', 'page turning'],
    milestone: 'book_engagement', domain: 'cognitive', confidence: 'medium', context: 'page_interaction' },

  // ── Outdoor play ──
  { keywords: ['park', 'outside', 'outdoor', 'garden', 'playground', 'walk outside', 'nature walk', 'grass', 'leaves'],
    milestone: 'outdoor_play', domain: 'motor', confidence: 'medium', context: 'outdoor_gross_motor' },
  { keywords: ['bahar', 'bahar khela', 'park gaye', 'garden mein'],
    milestone: 'outdoor_play', domain: 'motor', confidence: 'medium', context: 'hindi_outdoor' },

  // ── Bath time (sensory + motor) ──
  { keywords: ['bath', 'bathing', 'bath time', 'during bath', 'in the tub'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'medium', context: 'bath_sensory' },
  { keywords: ['naha', 'nahate', 'nahayi', 'nahaya', 'nahane'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'medium', context: 'hindi_bath' },

  // ── Indian cultural contexts ──
  { keywords: ['rangoli', 'diya', 'aarti', 'puja', 'pooja'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'high', context: 'cultural_sensory' },
  { keywords: ['roti', 'chapati', 'atta', 'dough play'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'high', context: 'food_sensory',
    exclude: ['ate', 'eating', 'fed', 'lunch', 'dinner', 'breakfast'] },
  { keywords: ['mango play', 'fruit play', 'vegetable play'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'high', context: 'food_exploration' },

  // ── Social games ──
  { keywords: ['peek-a-boo', 'peekaboo', 'this little piggy', 'round and round', 'patty cake', 'itsy bitsy'],
    milestone: 'social_game', domain: 'social', confidence: 'high', context: 'structured_game' },

  // ── Dance / movement ──
  { keywords: ['dance', 'danced', 'dancing', 'moves to music', 'bounced to music', 'swayed'],
    milestone: 'dance', domain: 'motor', confidence: 'high', context: 'rhythmic_movement' },
  { keywords: ['naachi', 'naacha', 'naachti', 'jhoom', 'jhoomti'],
    milestone: 'dance', domain: 'motor', confidence: 'high', context: 'hindi_dance' },

  // ── Puzzle / shape sorter ──
  { keywords: ['puzzle', 'jigsaw', 'shape sorter', 'peg board', 'ring stack', 'stacking rings'],
    milestone: 'puzzle', domain: 'cognitive', confidence: 'high', context: 'problem_solving_play' },

  // ── Screen time (low confidence) ──
  { keywords: ['screen', 'tv', 'tablet', 'phone', 'video', 'cartoon'],
    milestone: 'screen_time', domain: 'cognitive', confidence: 'low', context: 'passive_screen',
    exclude: ['video call', 'facetime', 'face time'] },
  { keywords: ['video call', 'facetime', 'face time', 'skype'],
    milestone: 'social_play', domain: 'social', confidence: 'medium', context: 'remote_social' },

  // ── Feeding-related evidence ──
  { keywords: ['chewing', 'chewed', 'biting food', 'munching', 'mashing with gums'],
    milestone: 'chew', domain: 'motor', confidence: 'high', context: 'oral_motor' },
  { keywords: ['swallow', 'swallowed', 'gulped'],
    milestone: 'swallow', domain: 'motor', confidence: 'medium', context: 'swallowing' },

  // ── Teething (motor) ──
  { keywords: ['tooth', 'teeth', 'teething', 'first tooth', 'new tooth'],
    milestone: 'teething', domain: 'motor', confidence: 'high', context: 'dental_milestone' },
  { keywords: ['daant', 'daant aaya', 'daant nikla', 'dant'],
    milestone: 'teething', domain: 'motor', confidence: 'high', context: 'hindi_teething' },

  // ── Emotional regulation ──
  { keywords: ['calmed down', 'self-sooth', 'self sooth', 'stopped crying', 'comforted self'],
    milestone: 'self_regulate', domain: 'social', confidence: 'high', context: 'emotional_regulation' },
  { keywords: ['tantrum', 'meltdown', 'frustrated', 'frustration'],
    milestone: 'self_regulate', domain: 'social', confidence: 'low', context: 'emotional_challenge' },

  // ── Following instructions ──
  { keywords: ['follow instruction', 'follow command', 'did what i said', 'came when called', 'gave it to me'],
    milestone: 'follow_instructions', domain: 'language', confidence: 'high', context: 'receptive_compliance' },
  { keywords: ['give me', 'put it here', 'bring it', 'come here'],
    milestone: 'follow_instructions', domain: 'language', confidence: 'medium', context: 'simple_command',
    require: ['did', 'followed', 'listened', 'obeyed', 'gave', 'brought', 'came'] },

  // ── Number / counting awareness ──
  { keywords: ['count', 'counting', 'one two', '1 2 3', 'numbers'],
    milestone: 'counting', domain: 'cognitive', confidence: 'medium', context: 'number_awareness',
    require: ['said', 'knows', 'points', 'tried', 'counted'] },

  // ── Animal awareness ──
  { keywords: ['dog', 'cat', 'bird', 'fish', 'animal', 'cow', 'horse'],
    milestone: 'animal_awareness', domain: 'cognitive', confidence: 'medium', context: 'animal_recognition',
    require: ['pointed', 'said', 'saw', 'excited', 'noticed', 'recognized', 'knows'] },
  { keywords: ['kutte', 'billi', 'gaay', 'chidiya', 'machhli', 'janwar'],
    milestone: 'animal_awareness', domain: 'cognitive', confidence: 'medium', context: 'hindi_animal' },

  // ═══════════════════════════════════════
  // EXPANDED PATTERNS: Additional keyword variants + compound activities
  // ═══════════════════════════════════════

  // ── Motor: Sitting variants ──
  { keywords: ['sat up', 'sits up', 'sitting up'],
    milestone: 'sit', domain: 'motor', confidence: 'high', context: 'sit_up_transition' },
  { keywords: ['w-sit', 'w sitting', 'w-sitting'],
    milestone: 'sit', domain: 'motor', confidence: 'medium', context: 'w_sitting' },
  { keywords: ['ring sit', 'ring sitting', 'long sit'],
    milestone: 'sit', domain: 'motor', confidence: 'high', context: 'floor_sitting' },
  { keywords: ['sat in bucket', 'sat in tub', 'sat in basin'],
    milestone: 'sit', domain: 'motor', confidence: 'high', context: 'contained_sit' },
  { keywords: ['sat on floor', 'sat on mat', 'sitting on ground'],
    milestone: 'sit', domain: 'motor', confidence: 'high', context: 'independent_floor' },

  // ── Motor: Rolling variants ──
  { keywords: ['log roll', 'log rolling'],
    milestone: 'roll', domain: 'motor', confidence: 'high', context: 'log_roll' },
  { keywords: ['flip', 'flipped', 'flipping over'],
    milestone: 'roll', domain: 'motor', confidence: 'high', context: 'flip',
    exclude: ['page', 'book', 'pancake'] },
  { keywords: ['pivot', 'pivoted', 'pivoting', 'spinning on tummy'],
    milestone: 'roll', domain: 'motor', confidence: 'medium', context: 'pivot' },

  // ── Motor: Crawling variants ──
  { keywords: ['bear crawl', 'bear walking'],
    milestone: 'crawl', domain: 'motor', confidence: 'high', context: 'bear_crawl' },
  { keywords: ['bum shuffle', 'bottom shuffle', 'shuffling', 'scooting on bum'],
    milestone: 'crawl', domain: 'motor', confidence: 'high', context: 'bottom_shuffle' },
  { keywords: ['creeping', 'crept', 'creep'],
    milestone: 'crawl', domain: 'motor', confidence: 'high', context: 'creeping' },
  { keywords: ['moved to', 'got to', 'reached'],
    milestone: 'crawl', domain: 'motor', confidence: 'low', context: 'inferred_movement',
    require: ['crawl', 'floor', 'tummy', 'belly', 'mat'] },

  // ── Motor: Standing variants ──
  { keywords: ['stood up', 'stands up', 'standing up'],
    milestone: 'pull_to_stand', domain: 'motor', confidence: 'high', context: 'stand_up' },
  { keywords: ['let go', 'lets go', 'free standing', 'freestanding', 'no support'],
    milestone: 'pull_to_stand', domain: 'motor', confidence: 'high', context: 'freestanding',
    require: ['stand', 'stood', 'standing'] },
  { keywords: ['balanced', 'balancing'],
    milestone: 'pull_to_stand', domain: 'motor', confidence: 'medium', context: 'balance',
    require: ['stand', 'stood', 'standing', 'feet', 'leg'] },
  { keywords: ['squat', 'squatted', 'squatting', 'sits to stand', 'stand from sit'],
    milestone: 'pull_to_stand', domain: 'motor', confidence: 'high', context: 'squat_to_stand' },

  // ── Motor: Walking variants ──
  { keywords: ['toddl', 'toddle', 'toddled', 'toddling'],
    milestone: 'walk', domain: 'motor', confidence: 'high', context: 'toddling' },
  { keywords: ['run', 'running', 'ran'],
    milestone: 'walk', domain: 'motor', confidence: 'high', context: 'running',
    exclude: ['nose run', 'runny'] },
  { keywords: ['one step', 'two steps', 'three steps', 'few steps', 'couple steps'],
    milestone: 'walk', domain: 'motor', confidence: 'high', context: 'early_steps' },
  { keywords: ['walks well', 'walking well', 'walking confidently', 'steady walk'],
    milestone: 'walk', domain: 'motor', confidence: 'high', context: 'confident_walking' },

  // ── Motor: Fine motor expanded ──
  { keywords: ['reached for', 'reaching', 'reaches for', 'stretched for'],
    milestone: 'grasp', domain: 'motor', confidence: 'low', context: 'pre_grasp' },
  { keywords: ['let go of', 'released', 'put down', 'dropped intentionally'],
    milestone: 'release', domain: 'motor', confidence: 'high', context: 'intentional_release' },
  { keywords: ['peel', 'peeled', 'peeling'],
    milestone: 'pincer', domain: 'motor', confidence: 'medium', context: 'peeling' },
  { keywords: ['tear', 'tore', 'tearing', 'ripped'],
    milestone: 'pincer', domain: 'motor', confidence: 'medium', context: 'tearing',
    exclude: ['cry', 'tears'] },
  { keywords: ['squeeze', 'squeezed', 'squeezing'],
    milestone: 'grasp', domain: 'motor', confidence: 'high', context: 'squeeze_grip' },
  { keywords: ['poke', 'poked', 'poking'],
    milestone: 'point', domain: 'motor', confidence: 'medium', context: 'index_isolation' },
  { keywords: ['twist', 'twisted', 'twisting', 'turned knob', 'turned handle'],
    milestone: 'container', domain: 'motor', confidence: 'high', context: 'rotation_grasp' },
  { keywords: ['thread', 'threaded', 'lacing', 'beading'],
    milestone: 'pincer', domain: 'motor', confidence: 'high', context: 'precision_task' },
  { keywords: ['sticker', 'stickers', 'peeled sticker', 'stuck sticker'],
    milestone: 'pincer', domain: 'motor', confidence: 'high', context: 'sticker_play' },
  { keywords: ['pour', 'poured', 'pouring'],
    milestone: 'cup_drink', domain: 'motor', confidence: 'medium', context: 'pouring' },

  // ── Motor: Stacking expanded ──
  { keywords: ['2 blocks', '3 blocks', '4 blocks', 'blocks high'],
    milestone: 'stack', domain: 'motor', confidence: 'high', context: 'counted_stacking' },
  { keywords: ['knocked over', 'knocked down', 'toppled'],
    milestone: 'cause_effect', domain: 'cognitive', confidence: 'medium', context: 'knock_down' },
  { keywords: ['nesting cups', 'cup stack', 'cups together'],
    milestone: 'nesting', domain: 'motor', confidence: 'high', context: 'nesting_cups' },

  // ── Motor: Self feeding expanded ──
  { keywords: ['mashed', 'mashing', 'squished food'],
    milestone: 'finger_feed', domain: 'motor', confidence: 'medium', context: 'food_exploration' },
  { keywords: ['dipped', 'dipping', 'dunking'],
    milestone: 'finger_feed', domain: 'motor', confidence: 'high', context: 'dipping_food' },
  { keywords: ['bit off', 'bite', 'bitten', 'took a bite'],
    milestone: 'chew', domain: 'motor', confidence: 'high', context: 'biting_food' },
  { keywords: ['chapati', 'roti', 'paratha', 'naan'],
    milestone: 'chew', domain: 'motor', confidence: 'medium', context: 'indian_bread',
    require: ['chew', 'ate', 'bit', 'feed', 'eating', 'munching'] },
  { keywords: ['straw cup', 'straw drink', 'drinking straw'],
    milestone: 'cup_drink', domain: 'motor', confidence: 'high', context: 'straw_drinking' },

  // ── Language: Babbling expanded ──
  { keywords: ['pa-pa', 'na-na', 'ta-ta', 'la-la', 'di-di'],
    milestone: 'babble', domain: 'language', confidence: 'high', context: 'diverse_babble' },
  { keywords: ['conversation', 'talking back', 'replying', 'responding with sounds'],
    milestone: 'babble', domain: 'language', confidence: 'high', context: 'turn_taking' },
  { keywords: ['scream', 'screaming', 'yelling', 'shouting'],
    milestone: 'babble', domain: 'language', confidence: 'low', context: 'vocal_experiment' },
  { keywords: ['whisper', 'whispering', 'quiet voice', 'soft voice'],
    milestone: 'babble', domain: 'language', confidence: 'medium', context: 'volume_control' },
  { keywords: ['raspberry', 'blowing', 'spitting', 'lip vibration'],
    milestone: 'babble', domain: 'language', confidence: 'medium', context: 'oral_motor_sound' },

  // ── Language: Words expanded ──
  { keywords: ['animal sound', 'moo', 'baa', 'woof', 'meow', 'quack', 'roar'],
    milestone: 'first_word', domain: 'language', confidence: 'medium', context: 'animal_sound' },
  { keywords: ['nahi', 'haan', 'aur', 'de do', 'kha', 'pee', 'lo'],
    milestone: 'first_word', domain: 'language', confidence: 'high', context: 'hindi_word_basic' },
  { keywords: ['new word today', 'said a new', 'learned to say'],
    milestone: 'first_word', domain: 'language', confidence: 'high', context: 'word_acquisition' },
  { keywords: ['sentence', 'full sentence', 'three word', '3 word'],
    milestone: 'two_word', domain: 'language', confidence: 'high', context: 'sentence' },
  { keywords: ['asks for', 'requesting', 'asked for', 'demands'],
    milestone: 'first_word', domain: 'language', confidence: 'high', context: 'functional_word' },

  // ── Language: Receptive expanded ──
  { keywords: ['no', 'stops when', 'stopped when'],
    milestone: 'understand_words', domain: 'language', confidence: 'medium', context: 'understands_no',
    require: ['said no', 'heard no', 'when i said', 'stopped'] },
  { keywords: ['show me', 'give me', 'bring', 'get the'],
    milestone: 'follow_instructions', domain: 'language', confidence: 'high', context: 'one_step_command',
    require: ['did', 'followed', 'obeyed', 'brought', 'gave', 'showed'] },
  { keywords: ['body part', 'nose', 'ear', 'eye', 'mouth', 'hand', 'feet', 'tummy', 'head'],
    milestone: 'understand_words', domain: 'language', confidence: 'high', context: 'body_part_id',
    require: ['pointed', 'touched', 'showed', 'knows', 'identified'] },
  { keywords: ['naak', 'kaan', 'aankh', 'mooh', 'haath', 'pair', 'pet', 'sir'],
    milestone: 'understand_words', domain: 'language', confidence: 'high', context: 'hindi_body_part',
    require: ['dikhayi', 'dikhaya', 'chuyi', 'pata', 'jaanti'] },

  // ── Language: Gestures expanded ──
  { keywords: ['raised arms', 'arms up', 'reaches up'],
    milestone: 'gesture', domain: 'language', confidence: 'high', context: 'pick_me_up',
    require: ['pick up', 'wants up', 'carry', 'lifted'] },
  { keywords: ['blow kiss', 'blew kiss', 'flying kiss'],
    milestone: 'gesture', domain: 'language', confidence: 'high', context: 'flying_kiss' },
  { keywords: ['thumbs up', 'high five', 'high-five', 'fist bump'],
    milestone: 'gesture', domain: 'language', confidence: 'high', context: 'social_gesture' },
  { keywords: ['shakes head no', 'head shake'],
    milestone: 'gesture', domain: 'language', confidence: 'high', context: 'head_shake_no' },
  { keywords: ['nods yes', 'nodding yes', 'head nod'],
    milestone: 'gesture', domain: 'language', confidence: 'high', context: 'head_nod_yes' },

  // ── Social: Expanded ──
  { keywords: ['shared food', 'feeds me', 'put food in my mouth', 'offered food'],
    milestone: 'sharing', domain: 'social', confidence: 'high', context: 'food_sharing' },
  { keywords: ['comfort', 'comforted', 'patted', 'patting', 'hugged when crying'],
    milestone: 'affection', domain: 'social', confidence: 'high', context: 'empathy' },
  { keywords: ['shows off', 'showing off', 'look what i can do', 'performs'],
    milestone: 'joint_attention', domain: 'social', confidence: 'high', context: 'performance' },
  { keywords: ['follows me', 'followed me', 'came after me', 'chased me'],
    milestone: 'social_play', domain: 'social', confidence: 'high', context: 'following_game' },
  { keywords: ['hide and seek', 'hiding', 'hid', 'found me', 'i found'],
    milestone: 'object_permanence', domain: 'social', confidence: 'high', context: 'hide_seek' },
  { keywords: ['doll', 'teddy', 'stuffed animal', 'soft toy', 'plushie'],
    milestone: 'pretend_play', domain: 'cognitive', confidence: 'medium', context: 'toy_attachment',
    require: ['fed', 'rocked', 'hugged', 'put to sleep', 'talked to', 'played with'] },
  { keywords: ['took turn', 'taking turns', 'my turn', 'your turn'],
    milestone: 'social_play', domain: 'social', confidence: 'high', context: 'turn_taking' },
  { keywords: ['gentle', 'gentle touch', 'stroked gently', 'patted softly'],
    milestone: 'affection', domain: 'social', confidence: 'high', context: 'gentle_touch' },
  { keywords: ['jealous', 'possessive', 'mine', 'no share', 'snatched'],
    milestone: 'social_play', domain: 'social', confidence: 'medium', context: 'ownership_awareness' },

  // ── Cognitive: Expanded ──
  { keywords: ['matching', 'matched', 'same', 'pairs', 'found match'],
    milestone: 'sorting', domain: 'cognitive', confidence: 'high', context: 'matching_game' },
  { keywords: ['in and out', 'in out', 'putting in', 'taking out', 'filling', 'emptying'],
    milestone: 'explore', domain: 'cognitive', confidence: 'high', context: 'containment_play' },
  { keywords: ['opened drawer', 'opened cupboard', 'opened door', 'opened bag'],
    milestone: 'explore', domain: 'cognitive', confidence: 'high', context: 'exploration_opening' },
  { keywords: ['phone', 'remote', 'keys', 'pretend phone', 'hello phone'],
    milestone: 'pretend_play', domain: 'cognitive', confidence: 'high', context: 'functional_object_use',
    require: ['pretend', 'played', 'used', 'held to ear', 'pressed'] },
  { keywords: ['tried again', 'kept trying', 'persistent', 'didn\'t give up'],
    milestone: 'problem_solve', domain: 'cognitive', confidence: 'high', context: 'persistence' },
  { keywords: ['surprised', 'surprised by', 'unexpected', 'didn\'t expect'],
    milestone: 'cause_effect', domain: 'cognitive', confidence: 'medium', context: 'expectation_violation' },
  { keywords: ['knows routine', 'anticipates', 'expected', 'ready for'],
    milestone: 'memory', domain: 'cognitive', confidence: 'high', context: 'routine_understanding' },
  { keywords: ['copy me', 'do this', 'watch this', 'follow me'],
    milestone: 'imitation', domain: 'social', confidence: 'medium', context: 'prompted_imitation',
    require: ['did', 'copied', 'followed', 'tried'] },

  // ── Sensory: Expanded ──
  { keywords: ['play dough', 'playdough', 'play-doh', 'clay play', 'kinetic sand'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'high', context: 'malleable_material' },
  { keywords: ['bubble', 'bubbles', 'popping bubbles', 'blowing bubbles'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'high', context: 'bubble_play' },
  { keywords: ['ice', 'ice cube', 'frozen', 'cold play'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'high', context: 'temperature_play' },
  { keywords: ['grass', 'leaves', 'flower', 'petal', 'nature'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'medium', context: 'nature_sensory' },
  { keywords: ['wind', 'breeze', 'fan', 'blow on'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'low', context: 'air_sensory' },
  { keywords: ['bare feet', 'barefoot', 'different surface', 'carpet', 'tile', 'wooden floor'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'medium', context: 'tactile_feet' },
  { keywords: ['taste', 'tasted', 'lick', 'licked', 'new flavour', 'new flavor'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'medium', context: 'gustatory' },
  { keywords: ['smell', 'smelled', 'sniffed', 'fragrance', 'aroma'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'medium', context: 'olfactory' },
  { keywords: ['massage', 'oil massage', 'malish', 'tel lagaya'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'medium', context: 'tactile_massage' },
  { keywords: ['finger paint', 'hand print', 'footprint', 'stamp'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'high', context: 'art_sensory' },

  // ── Compound activity patterns (multi-domain) ──
  { keywords: ['played with food', 'food play', 'messy eating'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'high', context: 'food_sensory_play' },
  { keywords: ['played with food', 'food play', 'messy eating'],
    milestone: 'finger_feed', domain: 'motor', confidence: 'medium', context: 'food_motor_play' },
  { keywords: ['bucket play', 'container play', 'box play', 'basket play'],
    milestone: 'explore', domain: 'cognitive', confidence: 'high', context: 'container_schema' },
  { keywords: ['stroller walk', 'pram walk', 'walk in park', 'morning walk'],
    milestone: 'outdoor_play', domain: 'motor', confidence: 'low', context: 'passive_outdoor' },
  { keywords: ['gym class', 'baby gym', 'swimming', 'swim class', 'baby swim'],
    milestone: 'outdoor_play', domain: 'motor', confidence: 'high', context: 'structured_motor_class' },
  { keywords: ['yoga', 'baby yoga', 'stretching'],
    milestone: 'tummy_time', domain: 'motor', confidence: 'medium', context: 'yoga_motor' },
  { keywords: ['obstacle course', 'tunnel', 'through tunnel', 'over pillow', 'climbing over'],
    milestone: 'crawl', domain: 'motor', confidence: 'high', context: 'obstacle_play' },
  { keywords: ['ball pit', 'ball pool'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'high', context: 'ball_pit_sensory' },
  { keywords: ['ball pit', 'ball pool'],
    milestone: 'grasp', domain: 'motor', confidence: 'medium', context: 'ball_pit_motor' },
  { keywords: ['ball play', 'playing ball', 'rolling ball', 'catch ball', 'throw ball'],
    milestone: 'throw', domain: 'motor', confidence: 'medium', context: 'ball_motor' },
  { keywords: ['ball play', 'playing ball', 'rolling ball'],
    milestone: 'social_play', domain: 'social', confidence: 'medium', context: 'ball_social' },

  // ── Indian cultural expanded ──
  { keywords: ['chai', 'chai time', 'chai play'],
    milestone: 'pretend_play', domain: 'cognitive', confidence: 'medium', context: 'chai_pretend',
    require: ['pretend', 'play', 'cup', 'pour'] },
  { keywords: ['aarti', 'diya', 'lamp', 'oil lamp'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'high', context: 'visual_cultural' },
  { keywords: ['garba', 'dandiya', 'bhangra'],
    milestone: 'dance', domain: 'motor', confidence: 'high', context: 'cultural_dance' },
  { keywords: ['kolam', 'rangoli', 'mehndi', 'mehendi'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'high', context: 'indian_art_sensory' },
  { keywords: ['dhol', 'dholak', 'mridangam', 'harmonium'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'high', context: 'indian_instrument' },
  { keywords: ['ghar ghar', 'ghar ghar khel', 'rasoi', 'khana banana'],
    milestone: 'pretend_play', domain: 'cognitive', confidence: 'high', context: 'hindi_pretend_play' },
  { keywords: ['namaste', 'namaskar', 'pranam'],
    milestone: 'gesture', domain: 'language', confidence: 'high', context: 'hindi_greeting' },
  { keywords: ['jhula', 'swing', 'jhulna'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'high', context: 'hindi_vestibular' },
  { keywords: ['gend', 'ball khela', 'ball phenka', 'ball pakda'],
    milestone: 'throw', domain: 'motor', confidence: 'high', context: 'hindi_ball_play' },

  // ── Additional Hindi motor ──
  { keywords: ['chadhi', 'chadha', 'chadhna', 'upar gayi'],
    milestone: 'climb', domain: 'motor', confidence: 'high', context: 'hindi_climb' },
  { keywords: ['kudna', 'kud gayi', 'kuda', 'ulti gayi'],
    milestone: 'bounce', domain: 'motor', confidence: 'high', context: 'hindi_jump' },
  { keywords: ['daudi', 'dauda', 'daudna', 'bhaga', 'bhagi'],
    milestone: 'walk', domain: 'motor', confidence: 'high', context: 'hindi_run' },
  { keywords: ['haath se pakad ke khaya', 'finger se khaya'],
    milestone: 'finger_feed', domain: 'motor', confidence: 'high', context: 'hindi_finger_food' },
  { keywords: ['glass se piya', 'cup se piya', 'sippy se piya'],
    milestone: 'cup_drink', domain: 'motor', confidence: 'high', context: 'hindi_cup_drink' },

  // ── Additional Hindi language ──
  { keywords: ['bolti', 'bolta', 'bol raha', 'bol rahi', 'baat kar rahi'],
    milestone: 'babble', domain: 'language', confidence: 'high', context: 'hindi_talking' },
  { keywords: ['samajhti hai', 'samajhta hai', 'sun ke karti'],
    milestone: 'understand_words', domain: 'language', confidence: 'high', context: 'hindi_comprehends' },
  { keywords: ['naam pe response', 'naam sune pe'],
    milestone: 'respond_name', domain: 'language', confidence: 'high', context: 'hindi_name_response_alt' },
  { keywords: ['dikha rahi', 'dikha raha', 'dikhaya', 'ye dekho'],
    milestone: 'point', domain: 'language', confidence: 'high', context: 'hindi_showing' },

  // ── Additional Hindi social ──
  { keywords: ['saath mein kheli', 'saath khela', 'dost ke saath'],
    milestone: 'social_play', domain: 'social', confidence: 'high', context: 'hindi_social_play' },
  { keywords: ['ro rahi', 'rone lagi', 'dar gayi', 'akeli nahi rehti'],
    milestone: 'separation_anxiety', domain: 'social', confidence: 'high', context: 'hindi_separation_alt' },
  { keywords: ['chupan chupai', 'chupa', 'dhundh liya'],
    milestone: 'object_permanence', domain: 'social', confidence: 'high', context: 'hindi_peekaboo' },

  // ── Additional Hindi cognitive ──
  { keywords: ['dhundh rahi', 'dhundha', 'kahan gaya', 'kahan hai'],
    milestone: 'object_permanence', domain: 'cognitive', confidence: 'high', context: 'hindi_search' },
  { keywords: ['samajh gayi kaise', 'seekh gayi', 'seekh liya'],
    milestone: 'cause_effect', domain: 'cognitive', confidence: 'high', context: 'hindi_learned' },
  { keywords: ['jod rahi', 'joda', 'mila rahi', 'milaya'],
    milestone: 'puzzle', domain: 'cognitive', confidence: 'high', context: 'hindi_joining' },

  // ── Time-of-day activity patterns ──
  { keywords: ['morning play', 'morning activity', 'morning routine'],
    milestone: 'tummy_time', domain: 'motor', confidence: 'low', context: 'morning_motor' },
  { keywords: ['bedtime routine', 'night routine', 'wind down'],
    milestone: 'book_engagement', domain: 'language', confidence: 'low', context: 'bedtime_routine' },
  { keywords: ['bath play', 'during bath', 'in the bath', 'bath time play'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'high', context: 'bath_time_play' },

  // ── Feeding-as-milestone evidence ──
  { keywords: ['tried new food', 'new food', 'first time eating', 'new taste'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'medium', context: 'food_novelty' },
  { keywords: ['chew well', 'chewing well', 'good chewing', 'chews properly'],
    milestone: 'chew', domain: 'motor', confidence: 'high', context: 'mature_chewing' },
  { keywords: ['lump', 'lumpy food', 'textured food', 'solid food'],
    milestone: 'chew', domain: 'motor', confidence: 'medium', context: 'texture_advance' },
  { keywords: ['sip', 'sipped', 'sipping'],
    milestone: 'cup_drink', domain: 'motor', confidence: 'high', context: 'sipping' },

  // ── Teeth milestones ──
  { keywords: ['bottom teeth', 'top teeth', 'front teeth', 'molar', 'incisor'],
    milestone: 'teething', domain: 'motor', confidence: 'high', context: 'specific_tooth' },
  { keywords: ['cutting tooth', 'tooth coming', 'tooth through', 'tooth broke through'],
    milestone: 'teething', domain: 'motor', confidence: 'high', context: 'eruption' },
  { keywords: ['4 teeth', 'six teeth', '6 teeth', '8 teeth', 'teeth count'],
    milestone: 'teething', domain: 'motor', confidence: 'high', context: 'tooth_count' },

  // ── Emotional / self-regulation expanded ──
  { keywords: ['happy', 'joyful', 'excited', 'delighted', 'thrilled'],
    milestone: 'social_smile', domain: 'social', confidence: 'low', context: 'positive_emotion' },
  { keywords: ['angry', 'frustrated', 'upset', 'mad'],
    milestone: 'self_regulate', domain: 'social', confidence: 'low', context: 'negative_emotion' },
  { keywords: ['calmed with', 'soothed by', 'comforted by', 'settled with'],
    milestone: 'self_regulate', domain: 'social', confidence: 'medium', context: 'co_regulation' },
  { keywords: ['blankie', 'comfort object', 'lovey', 'security blanket', 'favourite toy'],
    milestone: 'self_regulate', domain: 'social', confidence: 'medium', context: 'transitional_object' },

  // ═══════════════════════════════════════
  // BATCH 3: Additional variants to reach 500+
  // ═══════════════════════════════════════

  // ── Sitting: more context ──
  { keywords: ['sat alone', 'sitting alone', 'sits alone'],
    milestone: 'sit', domain: 'motor', confidence: 'high', context: 'alone_unsupported' },
  { keywords: ['sat for', 'sitting for', 'sat 5', 'sat 10', 'sat for minutes'],
    milestone: 'sit', domain: 'motor', confidence: 'high', context: 'sustained_sitting' },
  { keywords: ['toppled over', 'fell over while sitting', 'lost balance sitting'],
    milestone: 'sit', domain: 'motor', confidence: 'low', context: 'unstable_sitting' },
  { keywords: ['cross leg', 'cross-legged', 'indian style'],
    milestone: 'sit', domain: 'motor', confidence: 'high', context: 'cross_leg_sit' },
  { keywords: ['sat in stroller', 'sat in car seat', 'sat in swing'],
    milestone: 'sit', domain: 'motor', confidence: 'low', context: 'device_sitting' },

  // ── Crawling: more context ──
  { keywords: ['fast crawl', 'crawled fast', 'speed crawl', 'zoomed'],
    milestone: 'crawl', domain: 'motor', confidence: 'high', context: 'fast_crawl' },
  { keywords: ['crawled to me', 'crawled over', 'crawled across room'],
    milestone: 'crawl', domain: 'motor', confidence: 'high', context: 'directed_crawl' },
  { keywords: ['backwards', 'crawled backward', 'reverse crawl'],
    milestone: 'crawl', domain: 'motor', confidence: 'medium', context: 'reverse_crawl' },
  { keywords: ['hands and feet', 'plantigrade'],
    milestone: 'crawl', domain: 'motor', confidence: 'high', context: 'advanced_crawl' },

  // ── Walking: more context ──
  { keywords: ['walked to', 'walked over', 'walked across'],
    milestone: 'walk', domain: 'motor', confidence: 'high', context: 'directed_walk' },
  { keywords: ['fell while walking', 'stumbled', 'unsteady walk', 'wobbly walk'],
    milestone: 'walk', domain: 'motor', confidence: 'medium', context: 'early_walking' },
  { keywords: ['backward walk', 'walked backward', 'walking backwards'],
    milestone: 'walk', domain: 'motor', confidence: 'high', context: 'backward_walking' },
  { keywords: ['stooped to pick', 'bent down', 'squatted and stood', 'pick up while standing'],
    milestone: 'walk', domain: 'motor', confidence: 'high', context: 'advanced_balance' },

  // ── Climbing: more context ──
  { keywords: ['climbed on sofa', 'climbed on bed', 'climbed on chair', 'climbed couch'],
    milestone: 'climb', domain: 'motor', confidence: 'high', context: 'furniture_climb' },
  { keywords: ['climbed down', 'got down', 'descended'],
    milestone: 'climb', domain: 'motor', confidence: 'high', context: 'descending' },
  { keywords: ['slide', 'slid down', 'went down slide', 'climbing frame'],
    milestone: 'climb', domain: 'motor', confidence: 'high', context: 'playground_climb' },

  // ── Grasp: more specifics ──
  { keywords: ['held with both', 'two hands', 'both hands', 'bimanual'],
    milestone: 'grasp', domain: 'motor', confidence: 'high', context: 'bilateral_grasp' },
  { keywords: ['strong grip', 'tight grip', 'won\'t let go', 'firm hold'],
    milestone: 'grasp', domain: 'motor', confidence: 'high', context: 'grip_strength' },
  { keywords: ['delicate', 'careful', 'gentle pick', 'carefully picked'],
    milestone: 'pincer', domain: 'motor', confidence: 'high', context: 'refined_grasp' },

  // ── Transfer: more ──
  { keywords: ['moved from one hand', 'switched hands', 'passed from left to right', 'left to right'],
    milestone: 'transfer', domain: 'motor', confidence: 'high', context: 'detailed_transfer' },
  { keywords: ['holds in one, grabs with other', 'two toys', 'toy in each hand'],
    milestone: 'transfer', domain: 'motor', confidence: 'high', context: 'dual_hold' },

  // ── Banging: more ──
  { keywords: ['drum on table', 'drumming', 'bangs table', 'hits tray'],
    milestone: 'bang', domain: 'motor', confidence: 'high', context: 'surface_banging' },
  { keywords: ['spoon on plate', 'spoon banging', 'cup banging'],
    milestone: 'bang', domain: 'motor', confidence: 'high', context: 'mealtime_banging' },

  // ── Cup: more ──
  { keywords: ['open cup drink', 'drinks from open cup'],
    milestone: 'cup_drink', domain: 'motor', confidence: 'high', context: 'open_cup' },
  { keywords: ['sippy cup', 'training cup', '360 cup'],
    milestone: 'cup_drink', domain: 'motor', confidence: 'high', context: 'training_cup' },
  { keywords: ['bottle', 'holds bottle', 'holding bottle'],
    milestone: 'cup_drink', domain: 'motor', confidence: 'low', context: 'bottle_hold' },

  // ── Throwing: more ──
  { keywords: ['threw across', 'threw on floor', 'throws food', 'throws everything'],
    milestone: 'throw', domain: 'motor', confidence: 'high', context: 'intentional_throw' },
  { keywords: ['overhand throw', 'underhand throw', 'tossed forward'],
    milestone: 'throw', domain: 'motor', confidence: 'high', context: 'directional_throw' },

  // ── Drawing: more ──
  { keywords: ['scribbled', 'scribbles', 'mark on paper', 'marks on paper'],
    milestone: 'scribble', domain: 'motor', confidence: 'high', context: 'mark_making' },
  { keywords: ['color', 'colored', 'coloring', 'colouring'],
    milestone: 'scribble', domain: 'motor', confidence: 'medium', context: 'coloring',
    exclude: ['colour of poop', 'color of'] },

  // ── Babbling: more context ──
  { keywords: ['long babble', 'babble sentence', 'babble conversation', 'expressive babble'],
    milestone: 'babble', domain: 'language', confidence: 'high', context: 'expressive_babble' },
  { keywords: ['different sounds', 'new sounds', 'new consonant', 'variety of sounds'],
    milestone: 'babble', domain: 'language', confidence: 'high', context: 'diverse_phonemes' },
  { keywords: ['sing-song', 'melodic', 'intonation', 'question tone'],
    milestone: 'babble', domain: 'language', confidence: 'high', context: 'prosodic_babble' },

  // ── Words: more ──
  { keywords: ['uh oh', 'uh-oh', 'oh no', 'oops'],
    milestone: 'first_word', domain: 'language', confidence: 'high', context: 'exclamation_word' },
  { keywords: ['ta', 'taa', 'thank you', 'tank you'],
    milestone: 'first_word', domain: 'language', confidence: 'high', context: 'polite_word' },
  { keywords: ['all gone', 'all done', 'no more', 'finished'],
    milestone: 'first_word', domain: 'language', confidence: 'high', context: 'relational_word' },
  { keywords: ['mine', 'my', 'me', 'i want'],
    milestone: 'first_word', domain: 'language', confidence: 'medium', context: 'pronoun_use' },
  { keywords: ['hot', 'yucky', 'yummy', 'nice', 'dirty'],
    milestone: 'first_word', domain: 'language', confidence: 'high', context: 'descriptive_word' },
  { keywords: ['cat', 'dog', 'birdie', 'duck', 'fish', 'bunny'],
    milestone: 'first_word', domain: 'language', confidence: 'high', context: 'animal_word',
    require: ['said', 'says', 'word', 'called'] },
  { keywords: ['car', 'bus', 'truck', 'train', 'airplane', 'plane'],
    milestone: 'first_word', domain: 'language', confidence: 'high', context: 'vehicle_word',
    require: ['said', 'says', 'word', 'called', 'knows'] },

  // ── Pointing: more ──
  { keywords: ['points at everything', 'points at all', 'pointing constantly'],
    milestone: 'point', domain: 'language', confidence: 'high', context: 'frequent_pointing' },
  { keywords: ['pointed to ask', 'pointed to request', 'pointed wanting'],
    milestone: 'point', domain: 'language', confidence: 'high', context: 'proto_imperative' },

  // ── Understanding: more ──
  { keywords: ['looks at right object', 'looks at correct', 'turns to right'],
    milestone: 'understand_words', domain: 'language', confidence: 'high', context: 'word_object_link' },
  { keywords: ['understands no', 'knows no', 'stops when i say no'],
    milestone: 'understand_words', domain: 'language', confidence: 'high', context: 'no_comprehension' },
  { keywords: ['where is daddy', 'where is mummy', 'where is dog'],
    milestone: 'understand_words', domain: 'language', confidence: 'high', context: 'where_question' },

  // ── Social smile: more ──
  { keywords: ['belly laugh', 'laughed so hard', 'hysterical', 'cracking up'],
    milestone: 'social_smile', domain: 'social', confidence: 'high', context: 'deep_laughter' },
  { keywords: ['smiled at stranger', 'smiled at baby', 'smiled at mirror'],
    milestone: 'social_smile', domain: 'social', confidence: 'high', context: 'directed_smile' },
  { keywords: ['cheeky smile', 'mischievous', 'naughty smile', 'knows she is funny'],
    milestone: 'social_smile', domain: 'social', confidence: 'high', context: 'intentional_humor' },

  // ── Imitation: more ──
  { keywords: ['pretend cough', 'fake cough', 'fake sneeze', 'pretend sneeze'],
    milestone: 'imitation', domain: 'social', confidence: 'high', context: 'sound_imitation' },
  { keywords: ['copies facial', 'made same face', 'stuck tongue out', 'tongue out'],
    milestone: 'imitation', domain: 'social', confidence: 'high', context: 'facial_imitation' },
  { keywords: ['does same action', 'repeats action', 'watches then does'],
    milestone: 'imitation', domain: 'social', confidence: 'high', context: 'action_imitation' },
  { keywords: ['pretend sleep', 'fake sleep', 'closed eyes pretend'],
    milestone: 'imitation', domain: 'social', confidence: 'high', context: 'pretend_behavior' },

  // ── Object permanence: more ──
  { keywords: ['looked under', 'checked under', 'lifted up to find'],
    milestone: 'object_permanence', domain: 'cognitive', confidence: 'high', context: 'active_search' },
  { keywords: ['opened to find', 'looked inside', 'checked inside'],
    milestone: 'object_permanence', domain: 'cognitive', confidence: 'high', context: 'container_search' },
  { keywords: ['went to find', 'crawled to get', 'walked to get'],
    milestone: 'object_permanence', domain: 'cognitive', confidence: 'high', context: 'distant_search' },

  // ── Cause-effect: more ──
  { keywords: ['drop and look', 'drops on purpose', 'drops to see'],
    milestone: 'cause_effect', domain: 'cognitive', confidence: 'high', context: 'gravity_experiment' },
  { keywords: ['presses to make', 'press and hear', 'push and light'],
    milestone: 'cause_effect', domain: 'cognitive', confidence: 'high', context: 'button_cause_effect' },
  { keywords: ['shake rattle', 'shook to make sound', 'bang to hear'],
    milestone: 'cause_effect', domain: 'cognitive', confidence: 'high', context: 'sound_cause_effect' },
  { keywords: ['pull string', 'pulled cord', 'pulled to make'],
    milestone: 'cause_effect', domain: 'cognitive', confidence: 'high', context: 'pull_cause_effect' },

  // ── Problem solving: more ──
  { keywords: ['reached around', 'moved to get', 'used stool', 'climbed to reach'],
    milestone: 'problem_solve', domain: 'cognitive', confidence: 'high', context: 'means_end' },
  { keywords: ['figured out lock', 'opened latch', 'worked out how'],
    milestone: 'problem_solve', domain: 'cognitive', confidence: 'high', context: 'mechanism_solving' },
  { keywords: ['fit piece', 'found right hole', 'correct slot', 'matched shape'],
    milestone: 'shape_sort', domain: 'cognitive', confidence: 'high', context: 'shape_matching' },

  // ── Puzzle: more ──
  { keywords: ['ring stacker', 'stacking ring', 'ring pyramid'],
    milestone: 'puzzle', domain: 'cognitive', confidence: 'high', context: 'ring_stacker' },
  { keywords: ['wooden puzzle', 'knob puzzle', 'peg puzzle', 'inset puzzle'],
    milestone: 'puzzle', domain: 'cognitive', confidence: 'high', context: 'simple_puzzle' },
  { keywords: ['completed puzzle', 'finished puzzle', 'did the puzzle'],
    milestone: 'puzzle', domain: 'cognitive', confidence: 'high', context: 'puzzle_completion' },

  // ── Sensory: food textures ──
  { keywords: ['crunchy', 'crispy', 'chewy food', 'sticky food'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'medium', context: 'food_texture_sensory' },
  { keywords: ['refused texture', 'gagged on', 'didn\'t like texture'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'medium', context: 'texture_sensitivity' },
  { keywords: ['loves texture', 'liked the feel', 'enjoyed touching'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'high', context: 'texture_preference' },

  // ── Sensory: sound awareness ──
  { keywords: ['startled by', 'scared of sound', 'covered ears', 'noise sensitive'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'medium', context: 'auditory_sensitivity' },
  { keywords: ['loved music', 'danced to', 'bobbed head', 'swayed to music'],
    milestone: 'dance', domain: 'motor', confidence: 'high', context: 'music_response' },
  { keywords: ['clapped to music', 'clapped along', 'tapped feet'],
    milestone: 'clap', domain: 'social', confidence: 'high', context: 'musical_clapping' },

  // ── Sensory: visual ──
  { keywords: ['shadow play', 'shadows', 'light and shadow'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'high', context: 'shadow_visual' },
  { keywords: ['looked at hands', 'hand regard', 'watching hands'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'medium', context: 'hand_regard' },
  { keywords: ['colour sorting', 'color sorting', 'sorted by color'],
    milestone: 'sorting', domain: 'cognitive', confidence: 'high', context: 'color_sorting' },

  // ── Outdoor / nature expanded ──
  { keywords: ['played in garden', 'garden play', 'backyard play'],
    milestone: 'outdoor_play', domain: 'motor', confidence: 'high', context: 'garden_play' },
  { keywords: ['sand play', 'sand pit', 'sandpit', 'beach play'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'high', context: 'sand_play' },
  { keywords: ['puddle', 'rain play', 'playing in rain'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'high', context: 'rain_sensory' },
  { keywords: ['picked flower', 'picked leaf', 'picked grass'],
    milestone: 'pincer', domain: 'motor', confidence: 'medium', context: 'nature_pincer' },
  { keywords: ['watched birds', 'watched animals', 'watched insects'],
    milestone: 'animal_awareness', domain: 'cognitive', confidence: 'medium', context: 'animal_observation' },

  // ── Book: expanded ──
  { keywords: ['lifted flap', 'flap book', 'touch and feel book', 'texture book'],
    milestone: 'book_engagement', domain: 'language', confidence: 'high', context: 'interactive_book' },
  { keywords: ['pointed at picture', 'named picture', 'said word for picture'],
    milestone: 'book_engagement', domain: 'language', confidence: 'high', context: 'picture_naming' },
  { keywords: ['chose book', 'brought book', 'picked a book', 'asked for book'],
    milestone: 'book_engagement', domain: 'language', confidence: 'high', context: 'book_preference' },
  { keywords: ['turned pages', 'flipping pages', 'page by page'],
    milestone: 'page_turn', domain: 'motor', confidence: 'high', context: 'sequential_pages' },

  // ── Music / dance expanded ──
  { keywords: ['instrument', 'piano', 'keyboard', 'guitar toy', 'maracas'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'high', context: 'instrument_play' },
  { keywords: ['clap rhythm', 'clap along', 'rhythmic clap', 'beat'],
    milestone: 'clap', domain: 'motor', confidence: 'high', context: 'rhythmic_clapping' },
  { keywords: ['bobbing', 'head bob', 'body rock', 'rocking to'],
    milestone: 'dance', domain: 'motor', confidence: 'medium', context: 'rhythmic_body' },
  { keywords: ['stomping', 'stomped', 'foot stamp', 'marching'],
    milestone: 'dance', domain: 'motor', confidence: 'high', context: 'stomping' },

  // ── Dressing / undressing ──
  { keywords: ['took off sock', 'pulled sock', 'removed hat', 'took off shoe'],
    milestone: 'container', domain: 'motor', confidence: 'medium', context: 'undressing' },
  { keywords: ['put on hat', 'put on shoe', 'tried to dress', 'arm in sleeve'],
    milestone: 'container', domain: 'motor', confidence: 'high', context: 'dressing_attempt' },

  // ── Bath / hygiene ──
  { keywords: ['brush teeth', 'toothbrush', 'brushing teeth'],
    milestone: 'imitation', domain: 'social', confidence: 'medium', context: 'hygiene_imitation' },
  { keywords: ['washed hands', 'hand wash', 'washing hands'],
    milestone: 'follow_instructions', domain: 'language', confidence: 'medium', context: 'hygiene_routine' },
  { keywords: ['wiped face', 'wiped mouth', 'wiped hands', 'used napkin'],
    milestone: 'follow_instructions', domain: 'language', confidence: 'medium', context: 'self_care' },

  // ── More Hindi compound patterns ──
  { keywords: ['khel rahi', 'khel raha', 'khelti', 'khelta'],
    milestone: 'explore', domain: 'cognitive', confidence: 'low', context: 'hindi_playing_general' },
  { keywords: ['puzzle kiya', 'puzzle lagaya', 'puzzle solve'],
    milestone: 'puzzle', domain: 'cognitive', confidence: 'high', context: 'hindi_puzzle' },
  { keywords: ['block se tower', 'block lagaya', 'tower banaya'],
    milestone: 'stack', domain: 'motor', confidence: 'high', context: 'hindi_stacking' },
  { keywords: ['crayon se', 'pencil se', 'likha', 'likhti'],
    milestone: 'scribble', domain: 'motor', confidence: 'high', context: 'hindi_drawing' },
  { keywords: ['page palti', 'page palat', 'kitab ka page'],
    milestone: 'page_turn', domain: 'motor', confidence: 'high', context: 'hindi_page_turn' },
  { keywords: ['haath dhoya', 'haath dhoye', 'saaf kiya'],
    milestone: 'follow_instructions', domain: 'language', confidence: 'medium', context: 'hindi_hygiene' },
  { keywords: ['kapde utare', 'joota utara', 'topi utari'],
    milestone: 'container', domain: 'motor', confidence: 'medium', context: 'hindi_undressing' },
  { keywords: ['pyaar kiya', 'gale mila', 'pappi di', 'chummi di'],
    milestone: 'affection', domain: 'social', confidence: 'high', context: 'hindi_affection_alt' },
  { keywords: ['dekhte hue kheli', 'sab dekh rahi', 'gaur se dekha'],
    milestone: 'explore', domain: 'cognitive', confidence: 'medium', context: 'hindi_observation' },
  { keywords: ['apne aap', 'khud se', 'bina help'],
    milestone: 'problem_solve', domain: 'cognitive', confidence: 'medium', context: 'hindi_independent',
    require: ['kiya', 'ki', 'kar liya', 'seekha'] },
  { keywords: ['haan bola', 'haan kaha', 'sir hilaya haan'],
    milestone: 'gesture', domain: 'language', confidence: 'high', context: 'hindi_yes_nod' },
  { keywords: ['nahi bola', 'nahi kaha', 'sir hilaya nahi', 'mana kiya'],
    milestone: 'gesture', domain: 'language', confidence: 'high', context: 'hindi_no_shake' },
  { keywords: ['rote hue ruki', 'chup ho gayi', 'khud shant hui'],
    milestone: 'self_regulate', domain: 'social', confidence: 'high', context: 'hindi_self_soothe' },
  { keywords: ['khana phenka', 'cheez phenki', 'ball phenka'],
    milestone: 'throw', domain: 'motor', confidence: 'high', context: 'hindi_throwing' },
  { keywords: ['cheerio uthaya', 'chota piece uthaya', 'ungali se uthaya'],
    milestone: 'pincer', domain: 'motor', confidence: 'high', context: 'hindi_pincer' },
  { keywords: ['dono haath', 'ek haath se doosre'],
    milestone: 'transfer', domain: 'motor', confidence: 'high', context: 'hindi_transfer' },

  // ═══════════════════════════════════════
  // BATCH 4: Verb/context variants to cross 500
  // ═══════════════════════════════════════

  // ── Motor catch-all verbs ──
  { keywords: ['push', 'pushed', 'pushing'],
    milestone: 'grasp', domain: 'motor', confidence: 'low', context: 'push_action',
    require: ['toy', 'cart', 'ball', 'car', 'walker'] },
  { keywords: ['pull', 'pulled', 'pulling'],
    milestone: 'grasp', domain: 'motor', confidence: 'low', context: 'pull_action',
    require: ['toy', 'string', 'cord', 'blanket', 'cloth'],
    exclude: ['pull up', 'pull to stand', 'pulled to stand', 'pulling up'] },
  { keywords: ['hang', 'hanging', 'hung from'],
    milestone: 'pull_to_stand', domain: 'motor', confidence: 'medium', context: 'hanging' },
  { keywords: ['spin', 'spun', 'spinning'],
    milestone: 'explore', domain: 'cognitive', confidence: 'medium', context: 'spinning_object',
    require: ['toy', 'wheel', 'top', 'spinner'] },
  { keywords: ['open', 'opened', 'opening'],
    milestone: 'container', domain: 'motor', confidence: 'medium', context: 'opening_general',
    require: ['box', 'lid', 'door', 'drawer', 'bag', 'zip', 'clasp', 'velcro'] },
  { keywords: ['close', 'closed', 'closing', 'shut'],
    milestone: 'container', domain: 'motor', confidence: 'medium', context: 'closing_general',
    require: ['box', 'lid', 'door', 'drawer', 'bag'] },

  // ── Cruising expanded ──
  { keywords: ['walks holding', 'walking holding', 'walk with hand'],
    milestone: 'cruise', domain: 'motor', confidence: 'high', context: 'hand_held_walking' },
  { keywords: ['furniture walk', 'sofa walk', 'table edge walk'],
    milestone: 'cruise', domain: 'motor', confidence: 'high', context: 'furniture_cruising' },
  { keywords: ['couch surf', 'couch surfing'],
    milestone: 'cruise', domain: 'motor', confidence: 'high', context: 'couch_cruising' },

  // ── Head control expanded ──
  { keywords: ['look around', 'looking around', 'scanned room'],
    milestone: 'head_control', domain: 'motor', confidence: 'low', context: 'head_movement',
    require: ['tummy', 'prone', 'belly'] },

  // ── Kicking expanded ──
  { keywords: ['leg kick', 'kicking legs', 'kicks legs', 'bicycle legs'],
    milestone: 'kick', domain: 'motor', confidence: 'high', context: 'leg_kicking' },
  { keywords: ['splashed with feet', 'kicked water', 'feet splash'],
    milestone: 'kick', domain: 'motor', confidence: 'high', context: 'water_kick' },

  // ── Language: song/rhyme ──
  { keywords: ['twinkle', 'wheels on the bus', 'old macdonald', 'itsy bitsy', 'row row'],
    milestone: 'sing', domain: 'language', confidence: 'high', context: 'known_song' },
  { keywords: ['finished the line', 'completed the word', 'filled in word'],
    milestone: 'sing', domain: 'language', confidence: 'high', context: 'song_completion' },
  { keywords: ['action song', 'hand motion', 'motion song'],
    milestone: 'sing', domain: 'language', confidence: 'high', context: 'action_song' },

  // ── Social: play types ──
  { keywords: ['parallel play', 'played beside', 'next to other'],
    milestone: 'social_play', domain: 'social', confidence: 'medium', context: 'parallel_play' },
  { keywords: ['chase', 'chased', 'chasing', 'ran after'],
    milestone: 'social_play', domain: 'social', confidence: 'high', context: 'chase_game' },
  { keywords: ['tickle', 'tickled', 'tickling', 'ticklish'],
    milestone: 'social_smile', domain: 'social', confidence: 'high', context: 'tickle_game' },
  { keywords: ['rough play', 'rough and tumble', 'wrestling', 'roughhousing'],
    milestone: 'social_play', domain: 'social', confidence: 'high', context: 'rough_play' },
  { keywords: ['played alone', 'independent play', 'played by herself', 'played by himself'],
    milestone: 'explore', domain: 'cognitive', confidence: 'medium', context: 'solo_play' },

  // ── Cognitive: categorization ──
  { keywords: ['big and small', 'bigger', 'smaller', 'size'],
    milestone: 'sorting', domain: 'cognitive', confidence: 'medium', context: 'size_awareness',
    require: ['sorted', 'knows', 'identified', 'compared', 'chose'] },
  { keywords: ['same', 'different', 'not same', 'not like'],
    milestone: 'sorting', domain: 'cognitive', confidence: 'medium', context: 'comparison',
    require: ['said', 'knows', 'noticed', 'pointed'] },
  { keywords: ['up', 'down', 'in', 'out', 'on', 'under'],
    milestone: 'understand_words', domain: 'language', confidence: 'medium', context: 'spatial_word',
    require: ['knows', 'understands', 'followed', 'said', 'used correctly'] },

  // ── Feeding: more ──
  { keywords: ['holds own bottle', 'grips bottle', 'bottle by self'],
    milestone: 'grasp', domain: 'motor', confidence: 'high', context: 'bottle_grasp' },
  { keywords: ['blows on food', 'blow food', 'cooling food'],
    milestone: 'imitation', domain: 'social', confidence: 'high', context: 'feeding_imitation' },
  { keywords: ['feeds doll', 'feeds teddy', 'pretend feed', 'spoon to doll'],
    milestone: 'pretend_play', domain: 'cognitive', confidence: 'high', context: 'pretend_feeding' },

  // ── Sleep related ──
  { keywords: ['fought sleep', 'wouldn\'t sleep', 'resisted sleep'],
    milestone: 'self_regulate', domain: 'social', confidence: 'low', context: 'sleep_resistance' },
  { keywords: ['put herself to sleep', 'fell asleep on own', 'self settled'],
    milestone: 'independent_sleep', domain: 'social', confidence: 'high', context: 'self_settling' },

  // ── Exploration: containers/spatial ──
  { keywords: ['stacked rings', 'ring on pole', 'ring stacker'],
    milestone: 'nesting', domain: 'motor', confidence: 'high', context: 'ring_stacking_motor' },
  { keywords: ['posting', 'posted', 'post box', 'coin slot', 'piggy bank'],
    milestone: 'container', domain: 'motor', confidence: 'high', context: 'posting_play' },
  { keywords: ['screw', 'screwed', 'unscrewed', 'twist off', 'twist on'],
    milestone: 'container', domain: 'motor', confidence: 'high', context: 'screw_manipulation' },
  { keywords: ['zipper', 'zip', 'zipped', 'unzipped', 'velcro', 'button', 'snap'],
    milestone: 'container', domain: 'motor', confidence: 'high', context: 'fastener_manipulation',
    exclude: ['belly button', 'push button'] },

  // ── More verbs with activity context ──
  { keywords: ['carried', 'carrying', 'carries'],
    milestone: 'walk', domain: 'motor', confidence: 'medium', context: 'carrying_while_walking',
    require: ['while walk', 'around', 'toy', 'book', 'object', 'ball'] },
  { keywords: ['dug', 'digging', 'scooped sand', 'scooped dirt'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'high', context: 'digging_play' },
  { keywords: ['watering', 'watered', 'watering can', 'water plants'],
    milestone: 'pretend_play', domain: 'cognitive', confidence: 'medium', context: 'garden_pretend' },
  { keywords: ['sweeping', 'swept', 'broom', 'mopping'],
    milestone: 'imitation', domain: 'social', confidence: 'high', context: 'household_imitation' },
  { keywords: ['cooking pretend', 'stirring pretend', 'pretend kitchen'],
    milestone: 'pretend_play', domain: 'cognitive', confidence: 'high', context: 'kitchen_pretend' },

  // ── More Hindi daily activities ──
  { keywords: ['khana banaya pretend', 'rasoi kheli', 'bartan se kheli'],
    milestone: 'pretend_play', domain: 'cognitive', confidence: 'high', context: 'hindi_kitchen_pretend' },
  { keywords: ['jhadu lagaya', 'pocha lagaya', 'saaf kiya pretend'],
    milestone: 'imitation', domain: 'social', confidence: 'high', context: 'hindi_household' },
  { keywords: ['phone pe baat ki', 'hello bola phone'],
    milestone: 'pretend_play', domain: 'cognitive', confidence: 'high', context: 'hindi_phone_pretend' },
  { keywords: ['gudiya ko khilaya', 'teddy ko sulaya', 'gudiya ki maalish'],
    milestone: 'pretend_play', domain: 'cognitive', confidence: 'high', context: 'hindi_doll_play' },
  { keywords: ['painting ki', 'rang lagaya', 'drawing ki'],
    milestone: 'scribble', domain: 'motor', confidence: 'high', context: 'hindi_art' },
  { keywords: ['gaana sunaya', 'gaana gaaya', 'rhyme sunaya'],
    milestone: 'sing', domain: 'language', confidence: 'high', context: 'hindi_song' },
  { keywords: ['taali maari', 'taaliyan bajayi', 'gaane pe taali'],
    milestone: 'clap', domain: 'social', confidence: 'high', context: 'hindi_clapping_alt' },
  { keywords: ['nachte hue', 'naach rahi', 'gaane pe naachi'],
    milestone: 'dance', domain: 'motor', confidence: 'high', context: 'hindi_dance_alt' },
  { keywords: ['paani mein kheli', 'paani dala', 'paani se splash'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'high', context: 'hindi_water_alt' },
  { keywords: ['chhui mui', 'touch kiya', 'chhu ke dekha'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'medium', context: 'hindi_touch' },
  { keywords: ['sunghaya', 'sungha', 'smell ki'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'medium', context: 'hindi_smell' },

  // ── Safety/awareness patterns (not milestone but domain tagged) ──
  { keywords: ['fell', 'bumped', 'hit head', 'tumble'],
    milestone: 'explore', domain: 'motor', confidence: 'low', context: 'minor_fall',
    exclude: ['asleep', 'in love'] },
  { keywords: ['careful', 'cautious', 'looked before', 'checked edge'],
    milestone: 'problem_solve', domain: 'cognitive', confidence: 'medium', context: 'safety_awareness' },

  // ── Multi-step / complex ──
  { keywords: ['stacked then knocked', 'built then crashed', 'tower then toppled'],
    milestone: 'cause_effect', domain: 'cognitive', confidence: 'high', context: 'build_destroy_cycle' },
  { keywords: ['found toy under blanket', 'removed cloth found', 'uncovered and took'],
    milestone: 'object_permanence', domain: 'cognitive', confidence: 'high', context: 'multi_step_search' },
  { keywords: ['crawled to toy then', 'walked to get then', 'went and brought'],
    milestone: 'problem_solve', domain: 'cognitive', confidence: 'high', context: 'goal_directed' },
  { keywords: ['waved then said', 'pointed and said', 'gestured and spoke'],
    milestone: 'gesture', domain: 'language', confidence: 'high', context: 'gesture_word_combo' },

  // ── Final batch: Variant spellings, informal, and parent shorthand ──
  { keywords: ['sat unsupported', 'unsupported sit', 'no hands sitting'],
    milestone: 'sit', domain: 'motor', confidence: 'high', context: 'unsupported_explicit' },
  { keywords: ['tummy to sit', 'got to sitting', 'pushed up to sit'],
    milestone: 'sit', domain: 'motor', confidence: 'high', context: 'transition_to_sit' },
  { keywords: ['on all 4', 'all 4s', 'on fours'],
    milestone: 'crawl', domain: 'motor', confidence: 'medium', context: 'all_fours_informal' },
  { keywords: ['belly scoot', 'belly scooting', 'dragged herself'],
    milestone: 'crawl', domain: 'motor', confidence: 'high', context: 'belly_scoot' },
  { keywords: ['stood at', 'standing at', 'stands at'],
    milestone: 'pull_to_stand', domain: 'motor', confidence: 'high', context: 'standing_at_surface' },
  { keywords: ['holding rail', 'holding edge', 'holding bar'],
    milestone: 'cruise', domain: 'motor', confidence: 'medium', context: 'rail_hold' },
  { keywords: ['tiny step', 'baby step', 'little step'],
    milestone: 'walk', domain: 'motor', confidence: 'high', context: 'small_step' },
  { keywords: ['ripped paper', 'tore paper', 'paper ripping'],
    milestone: 'pincer', domain: 'motor', confidence: 'high', context: 'paper_tearing' },
  { keywords: ['smooshed', 'squashed', 'flattened'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'high', context: 'squash_tactile' },
  { keywords: ['shook', 'shaking', 'shakes'],
    milestone: 'cause_effect', domain: 'cognitive', confidence: 'medium', context: 'shaking',
    require: ['toy', 'rattle', 'bottle', 'maraca', 'shaker'] },
  { keywords: ['wriggled', 'wriggling', 'squirming'],
    milestone: 'roll', domain: 'motor', confidence: 'low', context: 'body_movement' },
  { keywords: ['scooted forward', 'inched forward', 'moved inch'],
    milestone: 'crawl', domain: 'motor', confidence: 'medium', context: 'inch_movement' },
  { keywords: ['dada bola', 'papa bola', 'papa kaha'],
    milestone: 'mama_dada_meaning', domain: 'language', confidence: 'medium', context: 'hindi_dada' },
  { keywords: ['mama bola', 'mummy bola', 'mamma kaha'],
    milestone: 'mama_dada_meaning', domain: 'language', confidence: 'medium', context: 'hindi_mama' },
  { keywords: ['hi bola', 'hello bola', 'bye bola'],
    milestone: 'first_word', domain: 'language', confidence: 'high', context: 'hindi_greeting_word' },
  { keywords: ['hands together', 'puts hands together'],
    milestone: 'clap', domain: 'motor', confidence: 'medium', context: 'hands_midline' },
  { keywords: ['mouth open', 'opens mouth', 'anticipate spoon'],
    milestone: 'memory', domain: 'cognitive', confidence: 'medium', context: 'feeding_anticipation' },
  { keywords: ['recognizes', 'recognized', 'knows face'],
    milestone: 'social_smile', domain: 'social', confidence: 'high', context: 'face_recognition' },
  { keywords: ['follow toy', 'followed toy', 'tracked toy', 'eyes followed'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'medium', context: 'visual_tracking' },
  { keywords: ['object in each', 'toy in each', 'holds two'],
    milestone: 'transfer', domain: 'motor', confidence: 'high', context: 'bilateral_hold' },
  { keywords: ['hand clap', 'hand clapping', 'patti cake'],
    milestone: 'clap', domain: 'social', confidence: 'high', context: 'hand_game' },
  { keywords: ['moved to music', 'responds to music', 'music response'],
    milestone: 'dance', domain: 'motor', confidence: 'medium', context: 'music_motor_response' },
  { keywords: ['touched face', 'grabbed glasses', 'pulled hair', 'grabbed nose'],
    milestone: 'grasp', domain: 'motor', confidence: 'medium', context: 'face_exploration' },
  { keywords: ['kicked off blanket', 'kicked off sock', 'kicked blanket'],
    milestone: 'kick', domain: 'motor', confidence: 'high', context: 'kick_object_off' },
  { keywords: ['crinkle', 'crinkled', 'crinkling paper', 'crinkle sound'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'high', context: 'crinkle_sensory' },
  { keywords: ['pop up', 'popup', 'pop-up toy', 'jack in box', 'jack-in-the-box'],
    milestone: 'cause_effect', domain: 'cognitive', confidence: 'high', context: 'popup_toy' },
  { keywords: ['activity gym', 'play gym', 'baby gym mat', 'play mat'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'medium', context: 'activity_gym' },
  { keywords: ['belly button', 'found belly button', 'poked belly'],
    milestone: 'understand_words', domain: 'language', confidence: 'medium', context: 'body_part_belly' },
  { keywords: ['peek', 'peeked', 'peeking', 'peeping'],
    milestone: 'object_permanence', domain: 'cognitive', confidence: 'medium', context: 'peeking',
    exclude: ['peek-a-boo', 'peekaboo'] },
  { keywords: ['woke up happy', 'woke smiling', 'smiled when woke'],
    milestone: 'social_smile', domain: 'social', confidence: 'medium', context: 'morning_smile' },
  { keywords: ['stranger smiled at', 'waved at stranger', 'friendly to new'],
    milestone: 'wave', domain: 'social', confidence: 'high', context: 'stranger_friendly' },
  { keywords: ['pulled cloth off', 'took cloth off face', 'removed cloth'],
    milestone: 'object_permanence', domain: 'cognitive', confidence: 'high', context: 'cloth_removal' },
  { keywords: ['clapped when finished', 'clapped herself', 'self applause'],
    milestone: 'clap', domain: 'social', confidence: 'high', context: 'self_celebration' },
  { keywords: ['tore roti', 'roti piece', 'broke roti', 'roti toda'],
    milestone: 'pincer', domain: 'motor', confidence: 'high', context: 'hindi_roti_tear' },
  { keywords: ['ghee mein haath', 'dal mein haath', 'khane se kheli'],
    milestone: 'sensory_explore', domain: 'sensory', confidence: 'high', context: 'hindi_food_sensory' },
];

// ─── Keyword-to-Milestone mapping ───
// Maps engine keywords to milestone text patterns in MILESTONE_STANDARDS
const KEYWORD_TO_MILESTONE = {
  // Motor - Gross
  sit:              'sit',
  roll:             'roll',
  crawl:            'crawl',
  pull_to_stand:    'pull',
  cruise:           'cruis',
  walk:             'walk',
  head_control:     'head',
  climb:            'climb',
  kick:             null,
  bounce:           null,
  tummy_time:       null,
  outdoor_play:     null,
  dance:            null,
  // Motor - Fine
  grasp:            'grasp',
  pincer:           'pincer',
  transfer:         'transfer',
  stack:            'stack',
  bang:             'bang',
  finger_feed:      'finger feed',
  spoon:            'spoon',
  cup_drink:        'cup',
  throw:            null,
  release:          null,
  scribble:         null,
  page_turn:        null,
  container:        null,
  nesting:          null,
  chew:             null,
  swallow:          null,
  teething:         'teeth',
  // Language
  coo:              'coo',
  babble:           'babbl',
  first_word:       'word',
  two_word:         'two word',
  mama_dada:        'mama/dada',
  mama_dada_meaning:'mama/dada with meaning',
  respond_name:     'respond',
  understand_words: 'understand',
  point:            'point',
  gesture:          'gesture',
  sing:             null,
  follow_instructions: 'follow',
  book_engagement:  null,
  // Social
  social_smile:     'smile',
  wave:             'wave',
  clap:             'clap',
  object_permanence:'object permanence',
  separation_anxiety:'separation',
  imitation:        null,
  sharing:          null,
  joint_attention:  null,
  independent_sleep:'sleep',
  social_play:      null,
  affection:        null,
  social_game:      null,
  self_regulate:    null,
  // Cognitive
  cause_effect:     'cause',
  problem_solve:    null,
  shape_sort:       'shape',
  color_recog:      null,
  memory:           null,
  explore:          null,
  pretend_play:     'pretend',
  sorting:          null,
  puzzle:           null,
  screen_time:      null,
  counting:         null,
  animal_awareness: null,
  // Sensory
  sensory_explore:  null,
};
// @@DATA_BLOCK_1_END@@

// @@DATA_BLOCK_2_START@@ DEFAULT_MILESTONES + DEFAULT_FOODS + DEFAULT_VACC + VACC_SCHEDULE + DEFAULT_MEDS + FOOD_SUGGESTIONS

const DEFAULT_MILESTONES = [
  { text:'Rolling', status:'mastered', advanced:false, masteredAt:'2026-01-15', emergingAt:'2026-01-05', cat:'motor' },
  { text:'Sitting independently', status:'mastered', advanced:false, masteredAt:'2026-02-20', emergingAt:'2026-02-10', cat:'motor' },
  { text:'Early teething signs', status:'mastered', advanced:false, masteredAt:'2026-03-01', emergingAt:'2026-02-20', cat:'motor' },
  { text:'Sleeps independently', status:'mastered', advanced:false, masteredAt:'2026-02-10', emergingAt:'2026-01-25', cat:'social' },
  { text:'Babbling', status:'mastered', advanced:false, masteredAt:'2026-03-05', emergingAt:'2026-02-15', cat:'language' },
  { text:'Responds to name', status:'mastered', advanced:false, masteredAt:'2026-03-10', emergingAt:'2026-03-01', cat:'language' },
  { text:'Pulls to stand using support (from sitting)', status:'mastered', advanced:true, masteredAt:'2026-03-18', emergingAt:'2026-03-10', practicingAt:'2026-03-12', consistentAt:'2026-03-16', cat:'motor' },
];

const DEFAULT_FOODS = [
  // 6 Mar — first day of solids: khichdi (moong dal + rice) + vegetables
  { name:'Moong dal', reaction:'ok', date:'2026-03-06' },
  { name:'Rice', reaction:'ok', date:'2026-03-06' },
  { name:'Carrot', reaction:'ok', date:'2026-03-06' },
  { name:'Beans', reaction:'ok', date:'2026-03-06' },
  { name:'Bottle gourd', reaction:'ok', date:'2026-03-06' },
  { name:'Beetroot', reaction:'ok', date:'2026-03-06' },
  // 7 Mar — banana introduced at breakfast
  { name:'Banana', reaction:'ok', date:'2026-03-07' },
  // 9 Mar — pear introduced at breakfast
  { name:'Pear', reaction:'ok', date:'2026-03-09' },
  // 11 Mar — boiled apple introduced at breakfast
  { name:'Apple', reaction:'ok', date:'2026-03-11' },
  // 16 Mar — avocado + blueberry introduced at dinner
  { name:'Avocado', reaction:'ok', date:'2026-03-16' },
  { name:'Blueberry', reaction:'ok', date:'2026-03-16' },
  // 17 Mar — masoor dal + ghee introduced at lunch
  { name:'Masoor dal', reaction:'ok', date:'2026-03-17' },
  { name:'Ghee', reaction:'ok', date:'2026-03-17' },
  // 18 Mar — ragi + almonds + walnut + date introduced at lunch
  { name:'Ragi', reaction:'ok', date:'2026-03-18' },
  { name:'Almonds', reaction:'ok', date:'2026-03-18' },
  { name:'Walnut', reaction:'ok', date:'2026-03-18' },
  { name:'Date (fruit)', reaction:'ok', date:'2026-03-18' },
  // 20 Mar — mango discussed, introduced
  { name:'Mango', reaction:'ok', date:'2026-03-20' },
];

const DEFAULT_VACC = [
  // ── BIRTH (6 Sep 2025) ──
  { name:'BCG', date:'2025-09-06', upcoming:false },
  { name:'OPV-0', date:'2025-09-06', upcoming:false },
  { name:'Hep B-1', date:'2025-09-06', upcoming:false },
  // ── 6 WEEKS (16 Oct 2025) ──
  { name:'DTwP/DTaP-1', date:'2025-10-16', upcoming:false },
  { name:'Hep B-2', date:'2025-10-16', upcoming:false },
  { name:'Hib-1', date:'2025-10-16', upcoming:false },
  { name:'IPV-1', date:'2025-10-16', upcoming:false },
  { name:'Rotavirus-1', date:'2025-10-16', upcoming:false },
  { name:'PCV-1', date:'2025-10-16', upcoming:false },
  // ── 10 WEEKS (16-18 Nov 2025) ──
  { name:'DTwP/DTaP-2', date:'2025-11-16', upcoming:false },
  { name:'Hep B-3', date:'2025-11-16', upcoming:false },
  { name:'Hib-2', date:'2025-11-16', upcoming:false },
  { name:'IPV-2', date:'2025-11-18', upcoming:false },
  { name:'OPV-1', date:'2025-11-18', upcoming:false },
  { name:'Rotavirus-2', date:'2025-11-16', upcoming:false },
  { name:'PCV-2', date:'2025-11-16', upcoming:false },
  // ── 14 WEEKS (18 Dec 2025) ──
  { name:'DTwP/DTaP-3', date:'2025-12-18', upcoming:false },
  { name:'Hep B-4', date:'2025-12-18', upcoming:false },
  { name:'Hib-3', date:'2025-12-18', upcoming:false },
  { name:'IPV-3', date:'2025-12-18', upcoming:false },
  { name:'Rotavirus-3', date:'2025-12-18', upcoming:false },
  { name:'PCV-3', date:'2025-12-18', upcoming:false },
  // ── 6 MONTHS (5 Mar 2026) ──
  { name:'TCV', date:'2026-03-05', upcoming:false },
  { name:'Influenza-1', date:'2026-03-05', upcoming:false },
  // ── UPCOMING ──
  { name:'Influenza-2', date:'2026-04-05', upcoming:true },
  { name:'MMR-1', date:'2026-06-04', upcoming:true },
  { name:'MCV-1', date:'2026-06-04', upcoming:true },
];

// ── MASTER VACCINATION SCHEDULE (IAP 2024 + card schedule) ──
// type: 'iap' = IAP mandatory, 'iap-rec' = IAP recommended, 'private' = optional/private
const VACC_SCHEDULE = [
  // ── BIRTH ──
  { name:'BCG', age:'Birth', type:'iap', protects:'Tuberculosis (TB)', notes:'Single dose, left upper arm. Small scar is normal.' },
  { name:'OPV-0', age:'Birth', type:'iap', protects:'Poliomyelitis', notes:'Oral drops. Zero dose within 24hrs of birth.' },
  { name:'Hep B-1', age:'Birth', type:'iap', protects:'Hepatitis B', notes:'Within 24 hours of birth. Free under UIP.' },

  // ── 6 WEEKS ──
  { name:'DTwP/DTaP-1', age:'6 weeks', type:'iap', protects:'Diphtheria, Tetanus, Pertussis (Whooping cough)', notes:'DTwP (whole cell) is free at govt centres. DTaP (acellular) has fewer side effects but is paid.' },
  { name:'Hep B-2', age:'6 weeks', type:'iap', protects:'Hepatitis B', notes:'Second dose. Part of Pentavalent combo.' },
  { name:'Hib-1', age:'6 weeks', type:'iap', protects:'Haemophilus influenzae type B (meningitis, pneumonia)', notes:'Part of Pentavalent at govt centres or Hexaxim at private.' },
  { name:'IPV-1', age:'6 weeks', type:'iap', protects:'Poliomyelitis (injectable)', notes:'Injectable polio. Mandatory alongside OPV.' },
  { name:'Rotavirus-1', age:'6 weeks', type:'iap', protects:'Rotavirus gastroenteritis (severe diarrhoea)', notes:'Oral vaccine. 2 or 3 doses depending on brand.' },
  { name:'PCV-1', age:'6 weeks', type:'iap', protects:'Pneumococcal disease (pneumonia, meningitis)', notes:'Now part of UIP in many states. Protects against 10-13 strains.' },

  // ── 10 WEEKS ──
  { name:'DTwP/DTaP-2', age:'10 weeks', type:'iap', protects:'Diphtheria, Tetanus, Pertussis', notes:'Second dose.' },
  { name:'Hep B-3', age:'10 weeks', type:'iap', protects:'Hepatitis B', notes:'Third dose.' },
  { name:'Hib-2', age:'10 weeks', type:'iap', protects:'Haemophilus influenzae B', notes:'Second dose.' },
  { name:'IPV-2', age:'10 weeks', type:'iap', protects:'Poliomyelitis', notes:'Second dose.' },
  { name:'OPV-1', age:'10 weeks', type:'iap', protects:'Poliomyelitis (oral)', notes:'First OPV booster. Can be given at 10 weeks or 6 months.' },
  { name:'Rotavirus-2', age:'10 weeks', type:'iap', protects:'Rotavirus', notes:'Second dose.' },
  { name:'PCV-2', age:'10 weeks', type:'iap', protects:'Pneumococcal disease', notes:'Second dose.' },

  // ── 14 WEEKS ──
  { name:'DTwP/DTaP-3', age:'14 weeks', type:'iap', protects:'Diphtheria, Tetanus, Pertussis', notes:'Third primary dose.' },
  { name:'Hep B-4', age:'14 weeks', type:'iap', protects:'Hepatitis B', notes:'Fourth dose (if 4-dose schedule used with Hexaxim).' },
  { name:'Hib-3', age:'14 weeks', type:'iap', protects:'Haemophilus influenzae B', notes:'Third dose.' },
  { name:'IPV-3', age:'14 weeks', type:'iap', protects:'Poliomyelitis', notes:'Third dose.' },
  { name:'Rotavirus-3', age:'14 weeks', type:'iap', protects:'Rotavirus', notes:'Third dose (if 3-dose brand like RotaSIIL).' },
  { name:'PCV-3', age:'14 weeks', type:'iap', protects:'Pneumococcal disease', notes:'Third dose.' },

  // ── 6 MONTHS ──
  { name:'TCV', age:'6 months', type:'iap-rec', protects:'Typhoid fever', notes:'Typhoid Conjugate Vaccine. Can be given from 6 months. IAP recommends 9-12 months.' },
  { name:'Influenza-1', age:'6 months', type:'iap-rec', protects:'Seasonal Influenza (Flu)', notes:'First dose. Needs a second dose 4 weeks later. Then annual.' },

  // ── 7 MONTHS ──
  { name:'Influenza-2', age:'7 months', type:'iap-rec', protects:'Seasonal Influenza', notes:'Second dose, 4 weeks after first. Annual booster thereafter.' },

  // ── 9 MONTHS ──
  { name:'MMR-1', age:'9 months', type:'iap', protects:'Measles, Mumps, Rubella', notes:'Critical vaccine. Measles remains a leading cause of child mortality in India.' },
  { name:'MCV-1', age:'9 months', type:'private', protects:'Meningococcal meningitis', notes:'Meningococcal Conjugate Vaccine. 2 doses (9 and 12 months). Recommended for travel/outbreak areas.' },
  { name:'OPV-2', age:'9 months', type:'iap', protects:'Poliomyelitis', notes:'OPV booster dose.' },

  // ── 12 MONTHS ──
  { name:'Hep A-1', age:'12 months', type:'iap-rec', protects:'Hepatitis A', notes:'First dose. Booster at 18 months. Killed vaccine (2 doses) or live vaccine (1 dose).' },
  { name:'JE-1', age:'12 months', type:'iap-rec', protects:'Japanese Encephalitis', notes:'Live attenuated vaccine. Important in endemic areas (eastern UP, Bihar, Jharkhand, Assam, West Bengal).' },
  { name:'MCV-2', age:'12 months', type:'private', protects:'Meningococcal meningitis', notes:'Second dose if first given at 9 months.' },
  { name:'PCV Booster', age:'12 months', type:'iap', protects:'Pneumococcal disease', notes:'Booster after primary 3-dose series.' },

  // ── 13 MONTHS ──
  { name:'JE-2', age:'13 months', type:'iap-rec', protects:'Japanese Encephalitis', notes:'Second dose, 4 weeks after first. Completes primary JE series.' },

  // ── 15 MONTHS ──
  { name:'MMR-2', age:'15 months', type:'iap', protects:'Measles, Mumps, Rubella', notes:'Second dose for full protection.' },
  { name:'Varicella-1', age:'15 months', type:'iap-rec', protects:'Chickenpox (Varicella)', notes:'First dose. Second dose at 18-19 months. Not in UIP — private only.' },
  { name:'PCV Booster-2', age:'15 months', type:'iap', protects:'Pneumococcal disease', notes:'Additional booster if using PCV-10.' },

  // ── 16-18 MONTHS ──
  { name:'DTwP/DTaP-B1', age:'16-18 months', type:'iap', protects:'Diphtheria, Tetanus, Pertussis', notes:'First booster after primary 3-dose series.' },
  { name:'Hib-B1', age:'16-18 months', type:'iap', protects:'Haemophilus influenzae B', notes:'Booster dose.' },
  { name:'IPV-B1', age:'16-18 months', type:'iap', protects:'Poliomyelitis', notes:'IPV booster dose.' },

  // ── 18-19 MONTHS ──
  { name:'Hep A-2', age:'18-19 months', type:'iap-rec', protects:'Hepatitis A', notes:'Second dose (if killed vaccine used).' },
  { name:'Varicella-2', age:'18-19 months', type:'iap-rec', protects:'Chickenpox', notes:'Second dose. Completes Varicella series.' },

  // ── 2 YEARS ──
  { name:'Typhoid Booster', age:'2 years', type:'iap-rec', protects:'Typhoid fever', notes:'Booster if TCV given earlier.' },

  // ── 4-6 YEARS ──
  { name:'DTwP/DTaP-B2', age:'4-6 years', type:'iap', protects:'Diphtheria, Tetanus, Pertussis', notes:'Second booster at school entry.' },
  { name:'IPV-B2', age:'4-6 years', type:'iap', protects:'Poliomyelitis', notes:'IPV booster at school entry.' },
  { name:'MMR-3', age:'4-6 years', type:'iap', protects:'Measles, Mumps, Rubella', notes:'Third dose at school entry.' },
  { name:'OPV Booster', age:'4-6 years', type:'iap', protects:'Poliomyelitis', notes:'Final OPV booster.' },

  // ── 9-14 YEARS ──
  { name:'Tdap', age:'9-14 years', type:'iap', protects:'Tetanus, Diphtheria, Pertussis (adolescent)', notes:'Adolescent booster.' },
  { name:'HPV-1', age:'9-14 years', type:'iap-rec', protects:'Human Papillomavirus (cervical cancer prevention)', notes:'First dose. Second dose 6 months later. For both boys and girls.' },
  { name:'HPV-2', age:'9-14 years', type:'iap-rec', protects:'Human Papillomavirus', notes:'Second dose, 6 months after first.' },

  // ── 16-18 YEARS ──
  { name:'Td', age:'16-18 years', type:'iap', protects:'Tetanus, Diphtheria', notes:'Adolescent Td booster.' },
];

const DEFAULT_MEDS = [
  {
    name:    'Vitamin D3 Drops',
    dose:    '0.5 ml · 800 IU',
    brand:   'Ultra D3 by Meyer Vitabiotics',
    freq:    'Once daily',
    start:   '2025-09-04',
    notes:   '',
    active:  true,
  },
];

const FOOD_SUGGESTIONS = {
  'Grains & Cereals': [
    'Rice (plain)','Rice (brown)','Rice porridge','Khichdi (moong dal)','Khichdi (masoor dal)','Khichdi (toor dal)','Khichdi (chana dal)','Khichdi (mixed dal)','Khichdi (vegetable)','Khichdi (palak)','Khichdi (beetroot)','Khichdi (pumpkin)','Khichdi (sweet potato)',
    'Ragi porridge','Ragi dosa','Ragi idli','Ragi halwa','Ragi malt',
    'Oats porridge','Oats kheer','Oats upma','Oats dosa',
    'Dalia (broken wheat)','Dalia khichdi','Dalia porridge','Dalia upma',
    'Suji (semolina)','Suji halwa','Suji upma','Suji kheer','Suji dosa',
    'Poha (flattened rice)','Poha upma',
    'Jowar (sorghum)','Jowar porridge','Jowar roti',
    'Bajra (pearl millet)','Bajra porridge','Bajra roti',
    'Wheat','Wheat porridge','Chapati','Roti',
    'Idli','Dosa','Uttapam','Pongal','Upma',
    'Sabudana (sago)','Sabudana khichdi','Sabudana kheer',
    'Maize (corn)','Makki porridge',
    'Barley','Barley water','Barley porridge',
    'Amaranth (rajgira)','Amaranth porridge',
  ],
  'Lentils & Legumes': [
    'Moong dal','Moong dal soup','Moong sprouts',
    'Masoor dal','Masoor dal soup',
    'Toor dal (arhar)','Toor dal soup',
    'Chana dal','Chana dal porridge',
    'Urad dal','Urad dal porridge',
    'Rajma (kidney beans)','Rajma mash',
    'Chole (chickpeas)','Chickpea mash',
    'Lobia (black-eyed peas)',
    'Green peas','Peas puree',
    'Mixed dal','Dal tadka','Dal palak','Dal fry',
    'Sambar','Rasam',
  ],
  'Fruits — Common': [
    'Apple','Apple puree','Stewed apple',
    'Banana','Banana mash',
    'Pear','Pear puree','Stewed pear',
    'Mango','Mango puree',
    'Papaya','Papaya mash',
    'Chiku (sapota)','Chiku puree',
    'Watermelon',
    'Muskmelon (cantaloupe)','Honeydew melon',
    'Orange','Orange juice (diluted)','Mosambi (sweet lime)',
    'Pomegranate','Pomegranate juice',
    'Guava',
    'Grapes (green, seedless)','Grapes (black, seedless)','Grapes (red, seedless)',
    'Strawberry',
    'Blueberry',
    'Raspberry',
    'Blackberry',
    'Prune','Prune puree',
    'Plum',
    'Peach','Peach puree',
    'Apricot','Dried apricot',
    'Cherry',
    'Fig (anjeer)','Dried fig',
    'Date (fruit)','Date puree',
    'Custard apple (sitaphal)',
    'Jamun (java plum)',
    'Amla (Indian gooseberry)',
    'Bael (wood apple)',
    'Pineapple',
    'Litchi (lychee)',
    'Coconut (tender)','Coconut water',
  ],
  'Fruits — Exotic': [
    'Avocado','Avocado mash',
    'Kiwi','Kiwi puree',
    'Dragon fruit','Dragon fruit (white)','Dragon fruit (red)',
    'Passion fruit',
    'Persimmon',
    'Starfruit (carambola)',
    'Jackfruit (ripe)',
    'Mulberry (shahtoot)',
    'Cranberry',
    'Gooseberry (amla)',
    'Loquat',
    'Rambutan',
    'Mangosteen',
    'Longan',
    'Sapota (chiku)',
    'Tamarind (imli)',
  ],
  'Vegetables — Common': [
    'Carrot','Carrot puree',
    'Beetroot','Beetroot puree',
    'Potato','Potato mash','Potato soup',
    'Sweet potato','Sweet potato puree',
    'Pumpkin','Pumpkin puree','Pumpkin soup',
    'Bottle gourd (lauki)','Lauki soup',
    'Ridge gourd (tori)',
    'Bitter gourd (karela)',
    'Snake gourd (chichinda)',
    'Ash gourd (petha)',
    'Ivy gourd (tindora)',
    'Pointed gourd (parwal)',
    'Beans (French beans)','Beans (broad/sem)',
    'Cluster beans (gawar)',
    'Drumstick (moringa)','Drumstick leaves',
    'Spinach (palak)','Spinach puree',
    'Fenugreek leaves (methi)',
    'Amaranth leaves (chaulai)',
    'Mustard greens (sarson)',
    'Bathua leaves',
    'Cabbage',
    'Cauliflower',
    'Broccoli','Broccoli puree',
    'Zucchini','Zucchini puree',
    'Peas (matar)',
    'Corn (sweet corn)',
    'Capsicum (bell pepper)',
    'Tomato','Tomato puree',
    'Onion (cooked)',
    'Garlic (cooked)',
    'Ginger (small amount)',
    'Cucumber',
    'Radish (mooli)',
    'Turnip (shalgam)',
    'Yam (suran/jimikand)',
    'Colocasia (arbi)',
    'Raw banana (kachha kela)',
    'Banana stem',
    'Lotus root (kamal kakdi)',
    'Jackfruit (raw/sabzi)',
  ],
  'Dairy': [
    'Ghee','Ghee (cow)','Ghee (buffalo)',
    'Curd (dahi)','Curd rice',
    'Paneer','Paneer mash',
    'Butter','Butter (white/makhan)',
    'Cream','Malai',
    'Cheese','Cheese (cottage)',
    'Buttermilk (chaas)',
    'Kheer','Rice kheer','Ragi kheer',
    'Raita',
  ],
  'Nuts & Seeds': [
    'Almonds','Almond powder','Almond milk',
    'Walnut','Walnut powder',
    'Cashew','Cashew powder',
    'Peanut','Peanut powder','Peanut butter',
    'Pistachio','Pistachio powder',
    'Sesame (til)','Sesame powder',
    'Flaxseed (alsi)','Flaxseed powder',
    'Chia seeds',
    'Pumpkin seeds',
    'Sunflower seeds',
    'Coconut (dried/desiccated)','Coconut milk',
    'Fox nuts (makhana)','Makhana powder',
    'Dry fruit powder (mixed)',
  ],
  'Spices & Flavourings': [
    'Turmeric (haldi)',
    'Jeera (cumin)','Jeera powder',
    'Ajwain (carom seeds)',
    'Cinnamon (dalchini)',
    'Cardamom (elaichi)',
    'Nutmeg (jaiphal)',
    'Black pepper (kali mirch)',
    'Hing (asafoetida)',
    'Coriander (dhania)','Coriander leaves',
    'Curry leaves (kadi patta)',
    'Saffron (kesar)',
    'Jaggery (gur)',
    'Mishri (rock sugar)',
    'Dry ginger powder (saunth)',
    'Fennel (saunf)',
    'Mint (pudina)',
    'Bay leaf (tej patta)',
  ],
  'Prepared Dishes': [
    'Khichdi (plain)','Khichdi (palak)','Khichdi (pumpkin)','Khichdi (mix veg)',
    'Vegetable soup','Tomato soup','Carrot soup','Pumpkin soup',
    'Dal rice','Curd rice','Lemon rice','Vegetable pulao',
    'Ragi porridge','Oats porridge','Wheat porridge','Bajra porridge',
    'Suji halwa','Ragi halwa','Banana halwa',
    'Idli','Dosa','Uttapam (vegetable)','Pongal',
    'Upma','Poha',
    'Paratha (stuffed)','Thepla','Chapati (soft)',
    'Vegetable puree','Mixed fruit puree',
    'Raita','Kheer',
    'Sheera','Payasam',
    'Sabudana khichdi',
  ],
  'Oils & Fats': [
    'Coconut oil','Sesame oil (gingelly)','Mustard oil','Olive oil','Groundnut oil',
  ],
  'Non-Veg (if applicable)': [
    'Egg yolk','Egg (whole)','Boiled egg',
    'Chicken (puree)','Chicken soup','Chicken broth',
    'Fish (fresh, boneless)','Fish soup',
    'Mutton soup','Mutton broth',
  ],
};
// @@DATA_BLOCK_2_END@@

// @@DATA_BLOCK_3_START@@ INDIAN_HOLIDAYS

// ─────────────────────────────────────────
// UPCOMING EVENTS — holidays, birthdays, custom
// ─────────────────────────────────────────

// ── Indian Holidays 2026–2027 (major national + Jharkhand-relevant) ──
const INDIAN_HOLIDAYS = [
  { date:'2026-01-14', title:'Makar Sankranti',       type:'holiday', icon:zi('star') },
  { date:'2026-01-26', title:'Republic Day',           type:'holiday', icon:'🇮🇳' },
  { date:'2026-03-04', title:'Holi',                   type:'holiday', icon:zi('palette') },
  { date:'2026-03-26', title:'Rama Navami',            type:'holiday', icon:'🪔' },
  { date:'2026-03-31', title:'Mahavir Jayanti',        type:'holiday', icon:'🪔' },
  { date:'2026-04-03', title:'Good Friday',            type:'holiday', icon:zi('star') },
  { date:'2026-04-14', title:'Ambedkar Jayanti',       type:'holiday', icon:'🇮🇳' },
  { date:'2026-05-01', title:'May Day',                type:'holiday', icon:zi('run') },
  { date:'2026-05-24', title:'Buddha Purnima',         type:'holiday', icon:'🪷' },
  { date:'2026-06-27', title:'Eid ul-Adha',            type:'holiday', icon:zi('moon') },
  { date:'2026-07-17', title:'Muharram',               type:'holiday', icon:zi('moon') },
  { date:'2026-08-15', title:'Independence Day',       type:'holiday', icon:'🇮🇳' },
  { date:'2026-08-28', title:'Raksha Bandhan',         type:'holiday', icon:zi('baby') },
  { date:'2026-09-04', title:'Ziva\'s 1st Birthday ', type:'birthday', icon:zi('party') },
  { date:'2026-09-04', title:'Krishna Janmashtami',    type:'holiday', icon:zi('star') },
  { date:'2026-09-14', title:'Ganesh Chaturthi',       type:'holiday', icon:zi('baby') },
  { date:'2026-09-16', title:'Milad un-Nabi',          type:'holiday', icon:zi('moon') },
  { date:'2026-10-02', title:'Gandhi Jayanti',         type:'holiday', icon:'🇮🇳' },
  { date:'2026-10-20', title:'Dussehra',               type:'holiday', icon:zi('run') },
  { date:'2026-11-08', title:'Diwali',                 type:'holiday', icon:'🪔' },
  { date:'2026-11-11', title:'Bhai Dooj',              type:'holiday', icon:zi('baby') },
  { date:'2026-11-15', title:'Chhath Puja',            type:'holiday', icon:zi('sun') },
  { date:'2026-11-15', title:'Jharkhand Foundation Day',type:'holiday', icon:zi('star') },
  { date:'2026-11-24', title:'Guru Nanak Jayanti',     type:'holiday', icon:'🪔' },
  { date:'2026-12-25', title:'Christmas',              type:'holiday', icon:zi('star') },
  // 2027
  { date:'2027-01-14', title:'Makar Sankranti',        type:'holiday', icon:zi('star') },
  { date:'2027-01-26', title:'Republic Day',           type:'holiday', icon:'🇮🇳' },
  { date:'2027-03-22', title:'Holi',                   type:'holiday', icon:zi('palette') },
];
// @@DATA_BLOCK_3_END@@

// @@DATA_BLOCK_4_START@@ EVENT_ACTIVITIES

// ── Activity suggestions per event type ──
const EVENT_ACTIVITIES = {
  birthday: [
    { icon:zi('star'), text:'Sing "Happy Birthday" together — she\'ll love the rhythm and clapping' },
    { icon:zi('camera'), text:'Photo session in a festive outfit — monthly photos are precious keepsakes' },
    { icon:zi('balloon'), text:'Let her explore balloons (supervised) — great for sensory and colour learning' },
    { icon:zi('party'), text:'Offer a new fruit or food to mark the occasion — a sweet first-taste tradition' },
  ],
  holiday: {
    'Holi':              [{ icon:zi('palette'), text:'Safe colour play with food-grade haldi on paper — sensory delight, zero chemicals' }, { icon:zi('drop'), text:'Warm water play in a basin with flower petals — festive and calming' }],
    'Diwali':            [{ icon:'🪔', text:'Show her a diya glow from safe distance — tracking the flicker builds visual focus' }, { icon:zi('sparkle'), text:'Explore fairy lights up close (supervised) — new light patterns stimulate curiosity' }],
    'Dussehra':          [{ icon:zi('star'), text:'Show her bright Ravana effigy pictures — bold colours and contrast build visual discrimination' }, { icon:zi('bell'), text:'Clap and cheer together — teaches emotional expression and turn-taking' }],
    'Raksha Bandhan':    [{ icon:zi('baby'), text:'Let her feel different thread and ribbon textures (supervised) — rich tactile sensory play' }, { icon:zi('baby'), text:'Encourage older cousins to play peek-a-boo — social bonding across ages' }],
    'Ganesh Chaturthi':  [{ icon:zi('star'), text:'Safe play-dough or atta dough — squeezing and pinching builds fine motor strength' }, { icon:zi('baby'), text:'Show elephant pictures and make trunk sounds — animal play builds sound association' }],
    'Krishna Janmashtami': [{ icon:zi('star'), text:'Show her peacock feathers (supervised) — vibrant colours and soft texture for sensory play' }, { icon:zi('spoon'), text:'Let her taste a tiny bit of makkhan — new taste and creamy texture exploration' }],
    'Makar Sankranti':   [{ icon:zi('star'), text:'Go outside and watch kites — tracking movement across the sky builds visual focus' }, { icon:zi('sun'), text:'Morning sunshine time — the festival of the sun aligns with her Vitamin D routine' }],
    'Independence Day':  [{ icon:'🇮🇳', text:'Dress her in orange, white, green — colour recognition and a memorable photo op' }, { icon:zi('star'), text:'March around the room while humming a tune — motor movement and rhythm play' }],
    'Republic Day':      [{ icon:'🇮🇳', text:'Watch parade clips on TV — marching bands are amazing for rhythm and visual tracking' }, { icon:zi('star'), text:'Let her wave a small soft cloth flag — grasping and waving builds arm coordination' }],
    'Christmas':         [{ icon:zi('star'), text:'Let her explore unbreakable ornaments — shiny surfaces and new shapes for sensory play' }, { icon:zi('star'), text:'Play gentle Christmas carols — new melodies expand her auditory palette' }],
    'Chhath Puja':       [{ icon:zi('sun'), text:'Watch the sunrise together — natural light exposure supports circadian rhythm' }, { icon:zi('spoon'), text:'Let her explore the fruit offerings (supervised) — naming fruits builds vocabulary' }],
    'Rama Navami':       [{ icon:'🪔', text:'Show her a small diya flame from safe distance — tracking the flicker builds attention' }, { icon:zi('book'), text:'Read a simple picture book about the story — early narrative exposure and bonding' }],
    'Mahavir Jayanti':   [{ icon:zi('sprout'), text:'Nature walk to a park — Jain philosophy celebrates all life, name the birds and plants she sees' }, { icon:zi('star'), text:'Practice a quiet moment together — gentle breathing, soft music, early calm-down routine' }],
    'Good Friday':       [{ icon:zi('star'), text:'Show her a candle flame from safe distance — visual focus on a still point builds attention span' }, { icon:zi('baby'), text:'Quiet bonding time — hold her close, read softly, match the reflective mood of the day' }],
    'Ambedkar Jayanti':  [{ icon:zi('book'), text:'Read a board book together — celebrate knowledge and learning, even at 6 months' }, { icon:zi('rainbow'), text:'Show her pictures of diverse faces — babies are building facial recognition skills' }],
    'May Day':           [{ icon:zi('sprout'), text:'Go outside and let her touch leaves and flowers — nature sensory exploration' }, { icon:zi('baby'), text:'Play with toy tools or blocks — early "building" play for spatial awareness' }],
    'Buddha Purnima':    [{ icon:'🪷', text:'Show her a lotus flower or pictures — name the parts (petals, stem) for vocabulary' }, { icon:zi('lotus'), text:'Gentle baby yoga stretches together — calming and builds flexibility' }],
    'Muharram':          [{ icon:zi('moon'), text:'Show her the moon at night — pointing and naming builds joint attention, a key social skill' }, { icon:zi('star'), text:'Let her hold and explore safe beaded items — grasping builds pincer grip development' }],
    'Milad un-Nabi':     [{ icon:zi('moon'), text:'Nighttime stargazing from a window — pointing at lights builds visual tracking' }, { icon:zi('star'), text:'Play soft nasheeds — new musical patterns expand auditory processing' }],
    'Eid ul-Fitr':       [{ icon:zi('sprout'), text:'Let her touch and smell flowers used for decoration — multi-sensory exploration' }, { icon:zi('baby'), text:'Practice "salaam" hand gesture — early social mimicry and motor coordination' }],
    'Eid ul-Adha':       [{ icon:zi('star'), text:'Show her animal picture books — name the animals clearly for word-object linking' }, { icon:zi('baby'), text:'Let her "share" food from her plate with you — builds social giving behaviour' }],
    'Gandhi Jayanti':    [{ icon:zi('star'), text:'Quiet outdoor time — sit on grass, feel the breeze, listen to bird sounds together' }, { icon:zi('baby'), text:'Let her "help" wipe a surface with a cloth — imitation play builds motor skills' }],
    'Navratri':          [{ icon:zi('star'), text:'Hold her and sway to garba music — vestibular stimulation and rhythm bonding' }, { icon:zi('bell'), text:'Give her a small bell or rattle to shake to the beat — cause-effect and motor skills' }],
    'Bhai Dooj':         [{ icon:zi('baby'), text:'Let siblings or cousins do tilak on each other — she can watch the ritual and faces up close' }, { icon:zi('spoon'), text:'Offer her a new fruit as her special "treat" — taste exploration on a sweet-themed day' }],
    'Guru Nanak Jayanti': [{ icon:zi('star'), text:'Play soft kirtan music — soothing new melodic patterns for auditory development' }, { icon:zi('baby'), text:'Practice "sharing" by handing toys back and forth — builds social reciprocity' }],
    'Jharkhand Foundation Day': [{ icon:zi('sprout'), text:'Outdoor walk in a local park — connect with nature in your home state' }, { icon:zi('star'), text:'Play Jharkhandi tribal music — unique rhythms and instruments expand her sound world' }],
    _default:            [{ icon:zi('party'), text:'Dress her up and take photos — she\'ll love seeing these when she\'s older' }, { icon:zi('baby'), text:'Family time together — let her soak in the festive atmosphere, sounds, and faces' }],
  },
  vacation: [
    { icon:zi('baby'), text:'Pack familiar foods — maintain her meal routine even while travelling' },
    { icon:zi('pill'), text:'Don\'t forget Vitamin D drops — travel disrupts routines' },
    { icon:zi('baby'), text:'Carry baby sunscreen + mosquito repellent if going outdoors' },
    { icon:zi('spoon'), text:'Pre-make ragi/dal powder in small zip bags — just add water for instant meals' },
    { icon:zi('moon'), text:'Try to keep nap and bedtime consistent — sleep routine matters more than location' },
  ],
  family: [
    { icon:zi('handshake'), text:'Let relatives interact at her pace — don\'t force if she\'s showing stranger anxiety (normal at this age)' },
    { icon:zi('camera'), text:'Great opportunity for multi-generational photos — she\'ll treasure these later' },
    { icon:zi('chat'), text:'Encourage family to speak to her in different languages — multilingual exposure boosts language circuits' },
    { icon:zi('bowl'), text:'If eating out, carry her food — restaurant food is too salty/spicy for babies' },
  ],
};
// @@DATA_BLOCK_4_END@@

// @@DATA_BLOCK_5_START@@ WHO growth reference tables

// ─────────────────────────────────────────
// GROWTH
// ─────────────────────────────────────────
// WHO Girls 50th percentile weight/height by month
const WHO_W50 = [3.2,4.2,5.1,5.8,6.4,6.9,7.3,7.6,7.9,8.2,8.5,8.7,8.9];
const WHO_H50 = [49.1,53.7,57.1,59.8,62.1,64.0,65.7,67.3,68.7,70.1,71.5,72.8,74.0];
const WHO_W3  = [2.4,3.2,3.9,4.5,4.9,5.3,5.7,6.0,6.3,6.5,6.7,6.9,7.0];
const WHO_W97 = [4.2,5.5,6.6,7.5,8.2,8.8,9.3,9.8,10.2,10.5,10.9,11.2,11.5];
const WHO_H3  = [45.6,49.8,52.8,55.5,57.8,59.6,61.2,62.7,64.0,65.3,66.5,67.6,68.6];
const WHO_H97 = [52.7,57.6,61.4,64.4,66.8,68.8,70.5,72.1,73.7,75.2,76.6,78.0,79.2];
// WHO P15 and P85 for better mid-range accuracy (girls, 0-12 months)
const WHO_W15 = [2.7,3.6,4.4,5.1,5.6,6.1,6.5,6.8,7.1,7.3,7.5,7.7,7.9];
const WHO_W85 = [3.7,4.9,5.9,6.7,7.3,7.9,8.3,8.7,9.0,9.4,9.7,10.0,10.2];
const WHO_H15 = [47.0,51.4,54.6,57.3,59.6,61.5,63.1,64.6,66.0,67.4,68.6,69.8,71.0];
const WHO_H85 = [51.3,56.1,59.7,62.5,64.8,66.8,68.5,70.1,71.6,73.0,74.4,75.7,76.9];
// @@DATA_BLOCK_5_END@@

// @@DATA_BLOCK_6_START@@ VACC_SERIES

// ── Vaccination Intelligence Upgrade — Constants ──

const VACC_SERIES = {
  'DTwP': ['DTwP/DTaP-1', 'DTwP/DTaP-2', 'DTwP/DTaP-3'],
  'Hep B': ['Hep B-1', 'Hep B-2', 'Hep B-3', 'Hep B-4'],
  'Hib': ['Hib-1', 'Hib-2', 'Hib-3'],
  'IPV': ['IPV-1', 'IPV-2', 'IPV-3'],
  'PCV': ['PCV-1', 'PCV-2', 'PCV-3'],
  'Rotavirus': ['Rotavirus-1', 'Rotavirus-2', 'Rotavirus-3'],
  'Influenza': ['Influenza-1', 'Influenza-2'],
  'MMR': ['MMR-1'],
};
// @@DATA_BLOCK_6_END@@

// @@DATA_BLOCK_7_START@@ VACC_DELAY_SAFETY + VACC_REACTION_SYMPTOMS + VACC_REACTION_GUIDANCE + POST_VACC buffers

const VACC_DELAY_SAFETY = {
  _default: { safe: 14, concern: 30, note: 'Most vaccines can safely be delayed by 1-2 weeks without affecting efficacy. Beyond 4 weeks, consult your pediatrician about catch-up scheduling.' },
  'BCG': { safe: 14, concern: 42, note: 'BCG can be delayed up to 6 weeks from birth. Beyond that, a tuberculin test may be needed before administering.' },
  'Hep B': { safe: 7, concern: 14, note: 'Birth dose of Hep B is time-sensitive. Subsequent doses can be delayed by 1-2 weeks safely.' },
  'Rotavirus': { safe: 7, concern: 14, note: 'Rotavirus has strict age windows. First dose must be before 15 weeks. Delay beyond the age window means the dose may be skipped entirely.' },
  'MMR': { safe: 14, concern: 30, note: 'MMR at 9 months is critical in India due to measles prevalence. A 2-week delay is usually fine, but avoid delaying beyond 4 weeks.' },
  'DTwP': { safe: 14, concern: 28, note: 'DTP vaccines can be delayed 2-4 weeks without restarting the series. The full primary series is important for complete protection.' },
  'Influenza': { safe: 21, concern: 42, note: 'Influenza vaccine timing is seasonal \u2014 delay is fine as long as it is given before peak flu season (Oct-Feb in India).' },
  'PCV': { safe: 14, concern: 28, note: 'PCV can be safely delayed by 2-4 weeks. The series does not need to be restarted if delayed.' },
};

const VACC_REACTION_SYMPTOMS = [
  { id: 'fever', label: 'Fever', icon: 'medical' },
  { id: 'crying', label: 'Crying', icon: 'drop' },
  { id: 'fussiness', label: 'Fussiness', icon: 'warn' },
  { id: 'swelling', label: 'Injection swelling', icon: 'info' },
  { id: 'rash', label: 'Rash', icon: 'warn' },
  { id: 'refused_feed', label: 'Refused feed', icon: 'spoon' },
  { id: 'sleepy', label: 'Extra sleepy', icon: 'moon' },
  { id: 'vomiting', label: 'Vomiting', icon: 'warn' },
];

const VACC_REACTION_GUIDANCE = {
  _default: {
    none: 'No reaction is great! Most babies handle vaccinations well.',
    mild: 'Mild reactions (low fever, fussiness) are normal and show the immune system is responding. Usually resolves within 24 hours. Offer extra fluids and comfort.',
    moderate: 'Moderate reactions may last 24-48 hours. Keep baby comfortable, lightly dressed. Offer frequent breastfeeds. Monitor temperature every 2-4 hours.',
    severe: 'Seek medical attention. Call your pediatrician immediately if fever exceeds 102\u00b0F, baby is inconsolable, has seizures, difficulty breathing, or refuses to feed for 6+ hours.',
    callDoctor: 'Fever >102\u00b0F or lasting >48 hours, inconsolable crying >3 hours, significant swelling, rash spreading, lethargy, refusal to feed.',
  },
  'DTwP': {
    mild: 'Mild fever and fussiness after DTwP are very common \u2014 this is the most reactive routine vaccine. Usually resolves within 24 hours. A small hard lump at the injection site may last 1-2 weeks and is harmless.',
    moderate: 'DTwP can cause moderate fever for 24-48 hours. This is normal. Give paracetamol ONLY if prescribed by your doctor. DTaP (acellular version) causes fewer reactions \u2014 discuss with your pediatrician for future doses.',
    note: 'DTwP (whole cell) causes more reactions than DTaP (acellular). Both are equally effective. If reactions are consistently moderate+, ask about switching to DTaP for remaining doses.',
  },
  'Rotavirus': {
    none: 'Rotavirus is an oral vaccine \u2014 no injection site soreness expected.',
    mild: 'Mild fussiness or loose stools for 1-2 days are normal after rotavirus vaccine.',
    callDoctor: 'Severe vomiting, blood in stool, or intense crying (drawing knees up) in the week after \u2014 these could indicate intussusception (very rare). Seek immediate care.',
  },
  'MMR': {
    mild: 'Mild fever or fussiness now is normal. Note: MMR can also cause a mild rash 7-10 days after vaccination \u2014 this is expected and harmless.',
    moderate: 'Fever after MMR can appear immediately or 7-12 days later. Both are normal immune responses. The delayed fever is not a new illness.',
    callDoctor: 'High fever >103\u00b0F, seizures, severe rash, or swollen glands lasting >2 weeks.',
  },
  'BCG': {
    none: 'A blister or scar at the injection site will develop over 2-6 months. This is expected and desired \u2014 it means the vaccine worked.',
    mild: 'The injection site may be slightly red or swollen. Do NOT apply any cream or bandage.',
    callDoctor: 'Large abscess at injection site, pus draining, or swollen lymph nodes in the armpit that are getting bigger.',
  },
  'PCV': {
    mild: 'Slight fussiness or mild fever is normal. PCV is generally well-tolerated.',
  },
  'Influenza': {
    mild: 'Mild soreness at the injection site and low fever for 1-2 days are common. This is the body building flu immunity.',
    note: 'First-year influenza requires two doses 4 weeks apart. Annual booster thereafter.',
  },
  'Hep B': {
    mild: 'Mild soreness at the injection site. Hepatitis B vaccine is one of the gentlest vaccines with very few reactions.',
  },
};

const POST_VACC_SLEEP_BUFFER = 5;
const POST_VACC_DIET_BUFFER = 3;
// @@DATA_BLOCK_7_END@@

// @@DATA_BLOCK_8_START@@ FOOD_TAX

// ── NESTED FOOD TAXONOMY (global for modal access) ──
const FOOD_TAX = {
  grains: {
    icon:zi('bowl'), label:'Grains & Cereals', color:'sage',
    subs: {
      rice_wheat: { icon:zi('bowl'), label:'Rice & Wheat', keys:['rice','wheat','suji','rava','poha','maida','vermicelli','bread'] },
      millets:    { icon:zi('sprout'), label:'Millets', keys:['ragi','jowar','bajra','dalia','amaranth','rajgira','barley'] },
      dals:       { icon:zi('bowl'), label:'Dals & Lentils', keys:['moong dal','masoor dal','toor dal','chana dal','urad dal','mixed dal','moong sprouts','dal tadka','dal fry','dal palak'] },
      legumes:    { icon:'🫛', label:'Legumes', keys:['rajma','chole','chickpea','lobia','soybean','peas','matar'] },
      prepared:   { icon:zi('bowl'), label:'Prepared', keys:['khichdi','idli','dosa','uttapam','pongal','upma','roti','chapati','paratha','thepla','pulao','sambar','rasam','sheera','payasam','sattu','sabudana','makki','corn'] },
    }
  },
  fruits: {
    icon:zi('spoon'), label:'Fruits', color:'rose',
    subs: {
      everyday:   { icon:zi('spoon'), label:'Everyday', keys:['banana','apple','pear','mango','papaya','chiku','sapota','guava','pomegranate','orange','mosambi','watermelon','muskmelon','honeydew','cantaloupe','grapes','pineapple','coconut','coconut water','lemon','plum','peach'] },
      berries:    { icon:zi('spoon'), label:'Berries', keys:['blueberry','strawberry','raspberry','blackberry','cherry','cranberry','mulberry'] },
      exotic:     { icon:zi('spoon'), label:'Exotic', keys:['avocado','kiwi','dragon fruit','passion fruit','persimmon','starfruit','carambola','rambutan','mangosteen','longan','loquat'] },
      traditional:{ icon:zi('star'), label:'Traditional', keys:['jamun','sitaphal','custard apple','bael','litchi','lychee','tamarind','amla','jackfruit'] },
      dried:      { icon:zi('spoon'), label:'Dried', keys:['date','fig','anjeer','prune','raisins','kishmish','apricot'] },
    }
  },
  vegs: {
    icon:zi('spoon'), label:'Vegetables', color:'peach',
    subs: {
      roots:      { icon:zi('spoon'), label:'Root & Tubers', keys:['carrot','potato','sweet potato','beetroot','yam','suran','turnip','shalgam','radish','mooli','colocasia','arbi','raw banana','kachha kela','lotus root','kamal kakdi'] },
      leafy:      { icon:zi('sprout'), label:'Leafy Greens', keys:['spinach','palak','methi','fenugreek','amaranth leaves','mustard greens','sarson','bathua','drumstick leaves','moringa','banana stem'] },
      gourds:     { icon:'🫛', label:'Gourds', keys:['bottle gourd','lauki','ridge gourd','tori','bitter gourd','karela','snake gourd','pointed gourd','parwal','ivy gourd','tindora','ash gourd','pumpkin','zucchini'] },
      flowering:  { icon:zi('spoon'), label:'Flowering', keys:['broccoli','cauliflower','cabbage','capsicum','bell pepper','drumstick','cluster beans','cucumber'] },
      beans_pods: { icon:zi('spoon'), label:'Beans & Pods', keys:['beans','corn','tomato'] },
      aromatics:  { icon:zi('bowl'), label:'Aromatics', keys:['onion','garlic','ginger'] },
    }
  },
  dairy: {
    icon:zi('drop'), label:'Dairy & Fats', color:'sky',
    subs: {
      dairy:      { icon:zi('drop'), label:'Dairy', keys:['ghee','curd','yogurt','dahi','paneer','cheese','butter','makhan','cream','malai','buttermilk','chaas','kheer','raita'] },
      oils:       { icon:zi('bowl'), label:'Cooking Oils', keys:['coconut oil','sesame oil','mustard oil','olive oil','groundnut oil'] },
    }
  },
  nuts: {
    icon:zi('spoon'), label:'Nuts & Seeds', color:'lav',
    subs: {
      nuts:       { icon:zi('spoon'), label:'Nuts', keys:['almonds','almond','walnut','cashew','peanut','pistachio','coconut','dry fruit'] },
      seeds:      { icon:zi('spoon'), label:'Seeds', keys:['sesame','til','flaxseed','alsi','pumpkin seeds','chia seeds','sunflower seeds','makhana','fox nuts','garden cress','halim','aliv'] },
    }
  },
  spices: {
    icon:zi('sprout'), label:'Spices', color:'amber',
    subs: {
      warm:       { icon:zi('sprout'), label:'Warm Spices', keys:['turmeric','haldi','cinnamon','dalchini','cardamom','elaichi','nutmeg','jaiphal','black pepper','saffron','kesar'] },
      tempering:  { icon:zi('bowl'), label:'Tempering', keys:['jeera','cumin','ajwain','hing','asafoetida','fennel','saunf','bay leaf'] },
      herbs:      { icon:zi('sprout'), label:'Fresh Herbs', keys:['coriander','dhania','curry leaves','mint','pudina'] },
      sweeteners: { icon:zi('spoon'), label:'Sweeteners', keys:['jaggery','gur','mishri'] },
    }
  },
  nonveg: {
    icon:zi('bowl'), label:'Non-Veg', color:'rose',
    subs: {
      eggs:       { icon:zi('bowl'), label:'Eggs', keys:['egg'] },
      poultry:    { icon:zi('bowl'), label:'Poultry', keys:['chicken'] },
      fish:       { icon:zi('bowl'), label:'Seafood', keys:['fish','prawn','shrimp'] },
      meat:       { icon:zi('bowl'), label:'Meat', keys:['mutton'] },
    }
  },
};
// @@DATA_BLOCK_8_END@@

// @@DATA_BLOCK_9_START@@ _foodColorMap + _foodBorderMap + _foodTextMap

const _foodColorMap = { sage:'var(--sage-light)', rose:'var(--rose-light)', peach:'var(--peach-light)', sky:'var(--sky-light)', lav:'var(--lav-light)', amber:'var(--amber-light)' };
const _foodBorderMap = { sage:'rgba(181,213,197,0.4)', rose:'rgba(242,168,184,0.3)', peach:'rgba(250,212,180,0.4)', sky:'rgba(168,207,224,0.4)', lav:'rgba(201,184,232,0.4)', amber:'rgba(232,184,109,0.3)' };
const _foodTextMap = { sage:'#3a7060', rose:'#b0485e', peach:'var(--tc-caution)', sky:'#3a7090', lav:'var(--tc-lav)', amber:'var(--tc-amber)' };
// @@DATA_BLOCK_9_END@@

// @@DATA_BLOCK_10_START@@ _FOOD_ALIASES + _FORM_WORDS

// ── Food Name Normalization ──
const _FOOD_ALIASES = {
  'moringa': 'drumstick', 'drumstick (moringa)': 'drumstick',
  'dates': 'date', 'date puree': 'date', 'date (fruit)': 'date',
  'ghee (cow)': 'ghee', 'cow ghee': 'ghee',
  'dahi': 'curd', 'yogurt': 'curd', 'yoghurt': 'curd',
  'lauki': 'bottle gourd', 'bottle gourd (lauki)': 'bottle gourd',
  'grapes (green': 'grape', 'grapes': 'grape', 'green grapes': 'grape',
  'ragi porridge': 'ragi',
  'sweet potato': 'sweet potato', 'shakarkandi': 'sweet potato',
  'til': 'sesame',
};

// Strip form/preparation words to get base food name
const _FORM_WORDS = ['puree','mash','mashed','porridge','powder','boiled','steamed','fried','roasted','soaked','grated','chopped','sliced','crushed','ground','paste','juice','soup','broth','water','cooked','raw','dried','fresh','baby','homemade','organic'];
// @@DATA_BLOCK_10_END@@

// @@DATA_BLOCK_11_START@@ FOOD_SYNERGIES

// ─────────────────────────────────────────
// NUTRITION KNOWLEDGE BASE
// ─────────────────────────────────────────

// ─────────────────────────────────────────
// FOOD SYNERGY DATABASE
// ─────────────────────────────────────────
// Each entry: [food1, food2, reason, type]
// type: 'absorption' (one helps absorb the other), 'complete' (together form complete nutrition), 'digestion' (one aids digestion of other)
const FOOD_SYNERGIES = [
  // Iron + Vitamin C = enhanced iron absorption (most critical for babies)
  ['ragi', 'orange', 'Vitamin C boosts iron absorption from ragi', 'absorption'],
  ['ragi', 'tomato', 'Vitamin C boosts iron absorption from ragi', 'absorption'],
  ['ragi', 'lemon', 'Vitamin C boosts iron absorption from ragi', 'absorption'],
  ['ragi', 'amla', 'Amla\'s vitamin C supercharges ragi\'s iron', 'absorption'],
  ['spinach', 'tomato', 'Vitamin C boosts iron absorption from spinach', 'absorption'],
  ['spinach', 'lemon', 'Vitamin C boosts iron absorption from spinach', 'absorption'],
  ['spinach', 'orange', 'Vitamin C boosts iron absorption from spinach', 'absorption'],
  ['beetroot', 'orange', 'Vitamin C boosts iron absorption from beetroot', 'absorption'],
  ['beetroot', 'lemon', 'Vitamin C boosts iron absorption from beetroot', 'absorption'],
  ['moong dal', 'tomato', 'Vitamin C boosts iron & protein absorption from dal', 'absorption'],
  ['masoor dal', 'tomato', 'Vitamin C boosts iron absorption from dal', 'absorption'],
  ['masoor dal', 'lemon', 'Lemon enhances iron absorption from dal', 'absorption'],
  ['moong dal', 'lemon', 'Lemon enhances iron absorption from dal', 'absorption'],
  ['poha', 'lemon', 'Lemon doubles iron absorption from poha', 'absorption'],
  ['bajra', 'amla', 'Amla\'s vitamin C boosts bajra\'s iron and zinc', 'absorption'],
  ['oats', 'strawberry', 'Vitamin C boosts iron absorption from oats', 'absorption'],
  ['oats', 'blueberry', 'Vitamin C + antioxidant synergy', 'absorption'],
  ['date (fruit)', 'orange', 'Vitamin C boosts iron absorption from dates', 'absorption'],
  ['pomegranate', 'beetroot', 'Double iron + vitamin C synergy', 'absorption'],

  // Fat + Fat-soluble vitamins (A, D, E, K)
  ['carrot', 'ghee', 'Ghee helps absorb beta-carotene (vitamin A) from carrot', 'absorption'],
  ['sweet potato', 'ghee', 'Ghee helps absorb beta-carotene from sweet potato', 'absorption'],
  ['pumpkin', 'ghee', 'Ghee helps absorb beta-carotene from pumpkin', 'absorption'],
  ['spinach', 'ghee', 'Ghee helps absorb vitamins A and K from spinach', 'absorption'],
  ['carrot', 'curd', 'Fat in curd helps absorb carrot\'s vitamin A', 'absorption'],
  ['mango', 'curd', 'Fat in curd helps absorb mango\'s vitamin A', 'absorption'],
  ['broccoli', 'ghee', 'Ghee helps absorb vitamin K from broccoli', 'absorption'],
  ['drumstick', 'ghee', 'Ghee helps absorb fat-soluble vitamins from drumstick', 'absorption'],

  // Complete protein combos (complementary amino acids)
  ['rice', 'moong dal', 'Complete protein — rice + dal cover all amino acids', 'complete'],
  ['rice', 'masoor dal', 'Complete protein — rice + dal cover all amino acids', 'complete'],
  ['rice', 'toor dal', 'Complete protein — rice + dal cover all amino acids', 'complete'],
  ['rice', 'rajma', 'Complete protein — rice + beans', 'complete'],
  ['rice', 'curd', 'Complete protein + probiotics for gut health', 'complete'],
  ['ragi', 'moong dal', 'Complete protein + double iron', 'complete'],
  ['ragi', 'curd', 'Calcium powerhouse — both are top calcium sources', 'complete'],
  ['oats', 'almonds', 'Complete protein + healthy fats for brain', 'complete'],
  ['idli', 'curd', 'Fermented duo — excellent for gut health', 'complete'],
  ['dosa', 'curd', 'Fermented duo — excellent for gut health', 'complete'],

  // Calcium + Vitamin D (bone health)
  ['paneer', 'ghee', 'Ghee\'s vitamin D helps absorb paneer\'s calcium', 'absorption'],
  ['curd', 'sesame', 'Double calcium — strongest bone-health combo', 'complete'],
  ['ragi', 'sesame', 'Double calcium + double iron', 'complete'],

  // Digestion helpers
  ['banana', 'curd', 'Banana\'s fibre + curd\'s probiotics aid digestion', 'digestion'],
  ['papaya', 'curd', 'Papaya enzymes + probiotics — digestion powerhouse', 'digestion'],
  ['rice', 'ghee', 'Ghee makes rice easier to digest, adds healthy fats', 'digestion'],
  ['khichdi', 'ghee', 'Ghee aids digestion of khichdi', 'digestion'],

  // Brain development combos
  ['walnut', 'ghee', 'Omega-3 + DHA — top brain development combo', 'complete'],
  ['avocado', 'banana', 'Healthy fats + potassium — brain + energy', 'complete'],
  ['almonds', 'date (fruit)', 'Brain-boosting fats + iron + natural energy', 'complete'],
  ['flaxseed', 'curd', 'Omega-3 + protein + calcium in one meal', 'complete'],
];
// @@DATA_BLOCK_11_END@@

// @@DATA_BLOCK_12_START@@ NUTRITION

const NUTRITION = {
  // ── GRAINS & STAPLES ──
  'ragi':           { nutrients:['iron','calcium','fibre','protein','phosphorus'], tags:['iron-rich','bone-health','protein-rich','gluten-free'] },
  'rice':           { nutrients:['carbs','energy','manganese'], tags:['energy','gluten-free','easy-digest'] },
  'suji':           { nutrients:['iron','carbs','protein','selenium'], tags:['iron-rich','energy'] },
  'khichdi':        { nutrients:['protein','carbs','iron','fibre'], tags:['complete-meal','iron-rich','easy-digest'] },
  'oats':           { nutrients:['fibre','iron','protein','magnesium','zinc','beta-glucan'], tags:['iron-rich','digestive','heart-health','energy'] },
  'poha':           { nutrients:['iron','carbs','fibre','vitamin B1'], tags:['iron-rich','energy','easy-digest'] },
  'sabudana':       { nutrients:['carbs','energy','calcium','potassium'], tags:['energy','easy-digest'] },
  'sattu':          { nutrients:['protein','iron','fibre','calcium','magnesium'], tags:['protein-rich','iron-rich','cooling','energy'] },
  'jowar':          { nutrients:['iron','protein','fibre','phosphorus','calcium'], tags:['iron-rich','bone-health','gluten-free','protein-rich'] },
  'bajra':          { nutrients:['iron','protein','fibre','magnesium','phosphorus','zinc'], tags:['iron-rich','protein-rich','bone-health','gluten-free'] },
  'dalia':          { nutrients:['fibre','protein','iron','magnesium'], tags:['digestive','iron-rich','protein-rich','energy'] },
  'idli':           { nutrients:['carbs','protein','vitamin B12','iron'], tags:['easy-digest','energy','fermented','gut-health'] },
  'dosa':           { nutrients:['carbs','protein','iron','vitamin B12'], tags:['energy','fermented','gut-health'] },

  // ── LENTILS & LEGUMES ──
  'moong dal':      { nutrients:['protein','iron','folate','potassium','fibre'], tags:['protein-rich','iron-rich','easy-digest'] },
  'masoor dal':     { nutrients:['protein','iron','folate','zinc','fibre'], tags:['protein-rich','iron-rich','blood-health'] },
  'toor dal':       { nutrients:['protein','iron','folate','fibre','magnesium'], tags:['protein-rich','iron-rich'] },
  'chana dal':      { nutrients:['protein','iron','folate','fibre','zinc','manganese'], tags:['protein-rich','iron-rich','energy'] },
  'urad dal':       { nutrients:['protein','iron','calcium','fibre','magnesium','phosphorus'], tags:['protein-rich','iron-rich','bone-health'] },
  'rajma':          { nutrients:['protein','iron','fibre','folate','potassium','zinc'], tags:['protein-rich','iron-rich','blood-health'] },

  // ── VEGETABLES ──
  'carrot':         { nutrients:['vitamin A','beta-carotene','fibre','potassium','vitamin K'], tags:['eye-health','vitamin-A','immune-boost'] },
  'beetroot':       { nutrients:['iron','folate','fibre','manganese','potassium','vitamin C'], tags:['iron-rich','blood-health','vitamin-C'] },
  'beans':          { nutrients:['protein','iron','fibre','vitamin K','folate'], tags:['iron-rich','protein-rich'] },
  'bottle gourd':   { nutrients:['water','fibre','zinc','vitamin C','potassium'], tags:['hydrating','digestive','cooling'] },
  'lauki':          { nutrients:['water','fibre','zinc','vitamin C','potassium'], tags:['hydrating','digestive','cooling'] },
  'spinach':        { nutrients:['iron','folate','vitamin K','vitamin A','vitamin C','calcium','magnesium'], tags:['iron-rich','bone-health','vitamin-A','vitamin-C','blood-health'] },
  'sweet potato':   { nutrients:['vitamin A','fibre','potassium','vitamin C','manganese','beta-carotene'], tags:['vitamin-A','energy','immune-boost','eye-health'] },
  'tomato':         { nutrients:['vitamin C','lycopene','potassium','vitamin K','folate'], tags:['vitamin-C','antioxidant','immune-boost'] },
  'pumpkin':        { nutrients:['vitamin A','beta-carotene','fibre','potassium','vitamin C','iron'], tags:['vitamin-A','eye-health','immune-boost','iron-rich'] },
  'broccoli':       { nutrients:['vitamin C','vitamin K','fibre','folate','iron','calcium','sulforaphane'], tags:['vitamin-C','bone-health','iron-rich','immune-boost','antioxidant'] },
  'zucchini':       { nutrients:['vitamin C','fibre','potassium','manganese','vitamin A'], tags:['digestive','hydrating','vitamin-C','easy-digest'] },
  'cucumber':       { nutrients:['water','vitamin K','potassium','fibre','silica'], tags:['hydrating','cooling','digestive'] },
  'potato':         { nutrients:['carbs','potassium','vitamin C','vitamin B6','fibre'], tags:['energy','vitamin-C'] },
  'drumstick':      { nutrients:['calcium','iron','vitamin A','vitamin C','protein','magnesium'], tags:['bone-health','iron-rich','vitamin-A','vitamin-C','immune-boost'] },
  'ash gourd':      { nutrients:['water','fibre','vitamin C','zinc','calcium'], tags:['hydrating','cooling','digestive'] },
  'ridge gourd':    { nutrients:['fibre','iron','vitamin C','zinc','water'], tags:['digestive','iron-rich','hydrating'] },

  // ── FRUITS ──
  'banana':         { nutrients:['potassium','carbs','vitamin B6','magnesium','fibre'], tags:['energy','digestive'] },
  'apple':          { nutrients:['fibre','vitamin C','antioxidants','quercetin'], tags:['digestive','vitamin-C','antioxidant','immune-boost'] },
  'pear':           { nutrients:['fibre','vitamin C','sorbitol','copper','potassium'], tags:['digestive','constipation-relief','vitamin-C'] },
  'avocado':        { nutrients:['healthy fats','folate','vitamin E','vitamin K','potassium','vitamin B6'], tags:['brain-health','healthy-fats','energy'] },
  'blueberry':      { nutrients:['antioxidants','vitamin C','fibre','vitamin K','manganese'], tags:['antioxidant','vitamin-C','brain-health','immune-boost'] },
  'mango':          { nutrients:['vitamin C','vitamin A','folate','fibre','beta-carotene'], tags:['vitamin-C','vitamin-A','immune-boost','eye-health'] },
  'papaya':         { nutrients:['vitamin C','fibre','digestive enzymes','folate','vitamin A','potassium'], tags:['digestive','vitamin-C','constipation-relief','immune-boost'] },
  'date (fruit)':   { nutrients:['iron','natural sugars','fibre','calcium','potassium','magnesium'], tags:['iron-rich','energy','bone-health'] },
  'date':           { nutrients:['iron','natural sugars','fibre','calcium','potassium','magnesium'], tags:['iron-rich','energy','bone-health'] },
  'chiku':          { nutrients:['fibre','iron','calcium','vitamin A','vitamin C','natural sugars'], tags:['energy','iron-rich','digestive','bone-health'] },
  'watermelon':     { nutrients:['water','lycopene','vitamin C','vitamin A','potassium'], tags:['hydrating','vitamin-C','cooling','antioxidant'] },
  'muskmelon':      { nutrients:['vitamin A','vitamin C','potassium','water','beta-carotene'], tags:['hydrating','vitamin-A','vitamin-C','cooling','eye-health'] },
  'pomegranate':    { nutrients:['iron','vitamin C','fibre','antioxidants','folate','potassium'], tags:['iron-rich','vitamin-C','antioxidant','blood-health'] },
  'orange':         { nutrients:['vitamin C','fibre','folate','potassium','thiamine'], tags:['vitamin-C','immune-boost','antioxidant'] },
  'kiwi':           { nutrients:['vitamin C','vitamin K','fibre','folate','potassium','vitamin E'], tags:['vitamin-C','immune-boost','digestive','antioxidant'] },
  'strawberry':     { nutrients:['vitamin C','manganese','fibre','folate','antioxidants'], tags:['vitamin-C','antioxidant','immune-boost'] },
  'plum':           { nutrients:['vitamin C','fibre','sorbitol','vitamin K','potassium'], tags:['vitamin-C','constipation-relief','digestive','antioxidant'] },
  'prune':          { nutrients:['fibre','sorbitol','iron','potassium','vitamin K'], tags:['constipation-relief','iron-rich','digestive'] },
  'coconut':        { nutrients:['healthy fats','fibre','manganese','copper','iron'], tags:['healthy-fats','energy','brain-health'] },
  'lemon':          { nutrients:['vitamin C','citric acid','potassium'], tags:['vitamin-C','immune-boost','iron-absorption'] },
  'amla':           { nutrients:['vitamin C','iron','fibre','antioxidants','calcium','chromium'], tags:['vitamin-C','immune-boost','iron-absorption','antioxidant'] },

  // ── DAIRY & FATS ──
  'ghee':           { nutrients:['healthy fats','fat-soluble vitamins','butyrate','vitamin A','vitamin D','omega-3'], tags:['healthy-fats','digestive','brain-health','bone-health'] },
  'curd':           { nutrients:['protein','calcium','probiotics','vitamin B12','phosphorus','zinc'], tags:['gut-health','bone-health','protein-rich','immune-boost','fermented'] },
  'yogurt':         { nutrients:['protein','calcium','probiotics','vitamin B12','phosphorus','zinc'], tags:['gut-health','bone-health','protein-rich','immune-boost','fermented'] },
  'dahi':           { nutrients:['protein','calcium','probiotics','vitamin B12','phosphorus','zinc'], tags:['gut-health','bone-health','protein-rich','immune-boost','fermented'] },
  'paneer':         { nutrients:['protein','calcium','phosphorus','healthy fats','vitamin B12','selenium'], tags:['protein-rich','bone-health','brain-health','healthy-fats'] },
  'cheese':         { nutrients:['protein','calcium','phosphorus','healthy fats','vitamin A','vitamin B12'], tags:['protein-rich','bone-health','healthy-fats'] },
  'butter':         { nutrients:['healthy fats','fat-soluble vitamins','vitamin A'], tags:['healthy-fats','energy','brain-health'] },
  'coconut oil':    { nutrients:['healthy fats','lauric acid','MCTs'], tags:['healthy-fats','brain-health','immune-boost','energy'] },

  // ── NUTS & SEEDS (powdered/soaked for babies) ──
  'almonds':        { nutrients:['healthy fats','protein','calcium','vitamin E','magnesium','fibre'], tags:['brain-health','bone-health','healthy-fats','protein-rich'] },
  'walnut':         { nutrients:['omega-3','healthy fats','protein','manganese','copper'], tags:['brain-health','omega-3','healthy-fats'] },
  'cashew':         { nutrients:['healthy fats','protein','iron','zinc','magnesium','copper'], tags:['brain-health','iron-rich','healthy-fats','protein-rich'] },
  'peanut':         { nutrients:['protein','healthy fats','fibre','folate','vitamin E','iron','zinc'], tags:['protein-rich','healthy-fats','iron-rich','energy'] },
  'sesame':         { nutrients:['calcium','iron','zinc','magnesium','healthy fats','copper','fibre'], tags:['bone-health','iron-rich','brain-health','healthy-fats'] },
  'til':            { nutrients:['calcium','iron','zinc','magnesium','healthy fats','copper','fibre'], tags:['bone-health','iron-rich','brain-health','healthy-fats'] },
  'flaxseed':       { nutrients:['omega-3','fibre','protein','magnesium','lignans'], tags:['omega-3','brain-health','digestive','heart-health'] },
  'pumpkin seeds':  { nutrients:['zinc','iron','magnesium','protein','healthy fats','omega-3'], tags:['immune-boost','iron-rich','brain-health','protein-rich'] },

  // ── SPICES & ENHANCERS (small amounts for babies) ──
  'turmeric':       { nutrients:['curcumin','iron','manganese','antioxidants'], tags:['anti-inflammatory','immune-boost','antioxidant'] },
  'jeera':          { nutrients:['iron','manganese','antioxidants'], tags:['digestive','iron-rich','anti-inflammatory'] },
  'cumin':          { nutrients:['iron','manganese','antioxidants'], tags:['digestive','iron-rich','anti-inflammatory'] },
  'ajwain':         { nutrients:['fibre','antioxidants','thymol'], tags:['digestive','anti-inflammatory'] },
  'hing':           { nutrients:['antioxidants','volatile oils'], tags:['digestive','anti-inflammatory'] },

  // ── EXPANDED: MORE GRAINS & STAPLES ──
  'amaranth':       { nutrients:['protein','iron','calcium','magnesium','fibre','lysine'], tags:['protein-rich','iron-rich','bone-health','gluten-free'] },
  'rajgira':        { nutrients:['protein','iron','calcium','magnesium','fibre','lysine'], tags:['protein-rich','iron-rich','bone-health','gluten-free'] },
  'barley':         { nutrients:['fibre','iron','selenium','manganese','copper'], tags:['digestive','iron-rich','heart-health'] },
  'wheat':          { nutrients:['carbs','protein','fibre','iron','B vitamins'], tags:['energy','iron-rich','protein-rich'] },
  'maida':          { nutrients:['carbs','energy'], tags:['energy'] },
  'rava':           { nutrients:['iron','carbs','protein','selenium'], tags:['iron-rich','energy'] },
  'vermicelli':     { nutrients:['carbs','protein','iron'], tags:['energy'] },
  'bread':          { nutrients:['carbs','iron','fibre'], tags:['energy'] },
  'roti':           { nutrients:['carbs','protein','fibre','iron'], tags:['energy','iron-rich'] },
  'chapati':        { nutrients:['carbs','protein','fibre','iron'], tags:['energy','iron-rich'] },
  'paratha':        { nutrients:['carbs','protein','healthy fats','iron'], tags:['energy','iron-rich'] },

  // ── EXPANDED: MORE LENTILS & LEGUMES ──
  'chana dal':      { nutrients:['protein','iron','fibre','folate','zinc','magnesium'], tags:['protein-rich','iron-rich','energy'] },
  'urad dal':       { nutrients:['protein','iron','fibre','calcium','magnesium','potassium'], tags:['protein-rich','iron-rich','bone-health'] },
  'rajma':          { nutrients:['protein','iron','fibre','folate','potassium','zinc'], tags:['protein-rich','iron-rich','digestive'] },
  'chickpeas':      { nutrients:['protein','iron','fibre','folate','zinc','manganese'], tags:['protein-rich','iron-rich','energy'] },
  'chole':          { nutrients:['protein','iron','fibre','folate','zinc','manganese'], tags:['protein-rich','iron-rich','energy'] },
  'soybean':        { nutrients:['protein','iron','calcium','omega-3','fibre','isoflavones'], tags:['protein-rich','iron-rich','bone-health'] },

  // ── EXPANDED: MORE VEGETABLES ──
  'moringa':        { nutrients:['iron','calcium','vitamin A','vitamin C','protein','potassium'], tags:['iron-rich','bone-health','vitamin-A','vitamin-C','protein-rich','immune-boost'] },
  'drumstick':      { nutrients:['iron','calcium','vitamin A','vitamin C','protein'], tags:['iron-rich','bone-health','vitamin-A','immune-boost'] },
  'drumstick leaves':{ nutrients:['iron','calcium','vitamin A','vitamin C','protein','potassium','magnesium'], tags:['iron-rich','bone-health','vitamin-A','vitamin-C','protein-rich'] },
  'lauki':          { nutrients:['water','fibre','zinc','vitamin C','potassium'], tags:['hydrating','digestive','cooling'] },
  'ash gourd':      { nutrients:['water','fibre','vitamin C','zinc','potassium'], tags:['hydrating','digestive','cooling'] },
  'ridge gourd':    { nutrients:['fibre','vitamin C','iron','zinc','water'], tags:['digestive','iron-rich','hydrating'] },
  'bitter gourd':   { nutrients:['vitamin C','iron','fibre','folate','zinc'], tags:['vitamin-C','iron-rich','immune-boost'] },
  'snake gourd':    { nutrients:['fibre','vitamin C','zinc','water'], tags:['digestive','hydrating'] },
  'capsicum':       { nutrients:['vitamin C','vitamin A','fibre','folate'], tags:['vitamin-C','vitamin-A','antioxidant'] },
  'bell pepper':    { nutrients:['vitamin C','vitamin A','fibre','folate'], tags:['vitamin-C','vitamin-A','antioxidant'] },
  'green peas':     { nutrients:['protein','iron','fibre','vitamin C','folate','zinc'], tags:['protein-rich','iron-rich','vitamin-C'] },
  'corn':           { nutrients:['carbs','fibre','vitamin B','iron','zinc'], tags:['energy','digestive'] },
  'cauliflower':    { nutrients:['vitamin C','vitamin K','fibre','folate'], tags:['vitamin-C','immune-boost','digestive'] },
  'cabbage':        { nutrients:['vitamin C','vitamin K','fibre','folate'], tags:['vitamin-C','digestive'] },
  'onion':          { nutrients:['vitamin C','fibre','folate','quercetin'], tags:['immune-boost','anti-inflammatory'] },
  'garlic':         { nutrients:['allicin','vitamin C','manganese','selenium'], tags:['immune-boost','anti-inflammatory','antioxidant'] },
  'ginger':         { nutrients:['gingerol','vitamin C','magnesium'], tags:['digestive','anti-inflammatory','immune-boost'] },
  'mushroom':       { nutrients:['vitamin D','protein','selenium','B vitamins','zinc'], tags:['immune-boost','protein-rich','bone-health'] },
  'lettuce':        { nutrients:['water','vitamin K','folate','fibre'], tags:['hydrating','digestive'] },
  'radish':         { nutrients:['vitamin C','fibre','potassium','folate'], tags:['vitamin-C','digestive'] },
  'turnip':         { nutrients:['vitamin C','fibre','potassium','folate'], tags:['vitamin-C','digestive'] },
  'yam':            { nutrients:['carbs','fibre','potassium','vitamin C','manganese'], tags:['energy','digestive','vitamin-C'] },
  'colocasia':      { nutrients:['carbs','fibre','potassium','magnesium','iron'], tags:['energy','iron-rich','digestive'] },
  'arbi':           { nutrients:['carbs','fibre','potassium','magnesium','iron'], tags:['energy','iron-rich','digestive'] },

  // ── EXPANDED: MORE FRUITS ──
  'litchi':         { nutrients:['vitamin C','copper','potassium','fibre'], tags:['vitamin-C','antioxidant','energy'] },
  'lychee':         { nutrients:['vitamin C','copper','potassium','fibre'], tags:['vitamin-C','antioxidant','energy'] },
  'grapes':         { nutrients:['vitamin C','vitamin K','potassium','antioxidants'], tags:['vitamin-C','antioxidant','energy'] },
  'plum':           { nutrients:['vitamin C','fibre','potassium','vitamin K','sorbitol'], tags:['vitamin-C','digestive','constipation-relief'] },
  'prune':          { nutrients:['fibre','iron','vitamin K','potassium','sorbitol'], tags:['iron-rich','digestive','constipation-relief'] },
  'fig':            { nutrients:['calcium','iron','fibre','potassium','magnesium'], tags:['bone-health','iron-rich','digestive','energy'] },
  'anjeer':         { nutrients:['calcium','iron','fibre','potassium','magnesium'], tags:['bone-health','iron-rich','digestive','energy'] },
  'jackfruit':      { nutrients:['vitamin C','vitamin A','fibre','potassium','magnesium'], tags:['vitamin-C','vitamin-A','energy','digestive'] },
  'guava':          { nutrients:['vitamin C','fibre','folate','potassium','vitamin A'], tags:['vitamin-C','immune-boost','digestive','antioxidant'] },
  'muskmelon':      { nutrients:['vitamin A','vitamin C','potassium','water'], tags:['vitamin-A','vitamin-C','hydrating','cooling'] },
  'jamun':          { nutrients:['iron','vitamin C','fibre','antioxidants'], tags:['iron-rich','vitamin-C','antioxidant'] },
  'sitaphal':       { nutrients:['vitamin C','fibre','potassium','magnesium','vitamin B6'], tags:['vitamin-C','energy','digestive'] },
  'custard apple':  { nutrients:['vitamin C','fibre','potassium','magnesium','vitamin B6'], tags:['vitamin-C','energy','digestive'] },
  'coconut':        { nutrients:['healthy fats','fibre','manganese','copper','MCTs'], tags:['healthy-fats','brain-health','energy'] },
  'coconut water':  { nutrients:['potassium','sodium','magnesium','calcium','water'], tags:['hydrating','cooling','energy'] },
  'amla':           { nutrients:['vitamin C','iron','calcium','antioxidants','fibre'], tags:['vitamin-C','immune-boost','iron-rich','antioxidant'] },
  'raisins':        { nutrients:['iron','fibre','potassium','natural sugars','calcium'], tags:['iron-rich','energy','digestive','bone-health'] },
  'kishmish':       { nutrients:['iron','fibre','potassium','natural sugars','calcium'], tags:['iron-rich','energy','digestive','bone-health'] },
  'strawberry':     { nutrients:['vitamin C','fibre','folate','antioxidants','manganese'], tags:['vitamin-C','antioxidant','immune-boost'] },
  'peach':          { nutrients:['vitamin C','vitamin A','fibre','potassium'], tags:['vitamin-C','vitamin-A','digestive'] },

  // ── EXPANDED: MORE DAIRY & FATS ──
  'coconut oil':    { nutrients:['healthy fats','MCTs','lauric acid'], tags:['healthy-fats','brain-health','energy','immune-boost'] },
  'butter':         { nutrients:['healthy fats','vitamin A','vitamin D','calcium'], tags:['healthy-fats','vitamin-A','bone-health'] },
  'cheese':         { nutrients:['calcium','protein','vitamin A','vitamin B12','phosphorus'], tags:['bone-health','protein-rich','brain-health'] },
  'yogurt':         { nutrients:['calcium','protein','probiotics','vitamin B12','phosphorus'], tags:['bone-health','protein-rich','gut-health'] },
  'dahi':           { nutrients:['calcium','protein','probiotics','vitamin B12','phosphorus'], tags:['bone-health','protein-rich','gut-health'] },

  // ── EXPANDED: MORE SEEDS ──
  'chia seeds':     { nutrients:['omega-3','fibre','calcium','protein','iron','magnesium'], tags:['omega-3','brain-health','bone-health','iron-rich','digestive'] },
  'sunflower seeds':{ nutrients:['vitamin E','selenium','protein','healthy fats','magnesium'], tags:['antioxidant','protein-rich','healthy-fats','brain-health'] },
  'garden cress':   { nutrients:['iron','calcium','protein','folate','vitamin C'], tags:['iron-rich','bone-health','protein-rich'] },
  'halim':          { nutrients:['iron','calcium','protein','folate','vitamin C'], tags:['iron-rich','bone-health','protein-rich'] },
  'aliv':           { nutrients:['iron','calcium','protein','folate','vitamin C'], tags:['iron-rich','bone-health','protein-rich'] },
};
// @@DATA_BLOCK_12_END@@

// @@DATA_BLOCK_13_START@@ AGE_RULES + ALLERGENS + COMBO_RULES

// ── AGE SAFETY RULES ──
const AGE_RULES = {
  'honey':    { minMonth:12, reason:'Risk of infant botulism — strictly avoid until 12 months' },
  'cow milk': { minMonth:12, reason:'Low in iron, hard on infant kidneys as main drink. Curd and paneer are fine.' },
  'cow\'s milk':{minMonth:12, reason:'Low in iron, hard on infant kidneys as main drink. Curd and paneer are fine.' },
  'milk':     { minMonth:12, reason:'As a drink, avoid until 12 months. Curd, paneer, and small amounts in cooking are fine.' },
  'salt':     { minMonth:12, reason:'Baby\'s kidneys cannot process added salt. Natural sodium in foods is enough.' },
  'sugar':    { minMonth:12, reason:'No added sugar before 12 months. Use fruit for natural sweetness.' },
  'jaggery':  { minMonth:12, reason:'Treat as added sugar — avoid before 12 months.' },
  'gur':      { minMonth:12, reason:'Treat as added sugar — avoid before 12 months.' },
  'tea':      { minMonth:24, reason:'Tannins block iron absorption. Caffeine is harmful for babies.' },
  'coffee':   { minMonth:24, reason:'Caffeine is harmful for infants and toddlers.' },
  'juice':    { minMonth:8, reason:'Whole fruit is better. If juice, limit to 2-3 tsp diluted in an open cup, never a bottle.' },
  'whole nut': { minMonth:60, reason:'Choking hazard — always use powdered or paste form for babies.' },
  'whole nuts':{ minMonth:60, reason:'Choking hazard — always use powdered or paste form for babies.' },
  'popcorn':  { minMonth:48, reason:'Choking hazard — avoid for young children.' },
  'raw salad':{ minMonth:12, reason:'Raw vegetables are hard to chew and digest. Steam or cook first.' },
  'chocolate':{ minMonth:12, reason:'Contains sugar and caffeine. Avoid before 12 months.' },
  'biscuit':  { minMonth:10, reason:'Most contain sugar, salt, and maida. If giving, choose sugar-free, whole grain.' },
  'chips':    { minMonth:24, reason:'High salt, trans fats. Not suitable for babies.' },
  'ice cream':{ minMonth:12, reason:'Contains sugar and cow milk. Avoid before 12 months.' },
  'kheer':    { minMonth:10, reason:'Often made with cow milk and sugar. Use breast milk/formula and fruit instead.' },
  'fish':     { minMonth:7, reason:'Introduce after 7 months. Start with mild, boneless fish. Ensure it is vegetarian diet — check with parents.' },
  'chicken':  { minMonth:7, reason:'Can introduce after 7 months as puree. Note: this family follows vegetarian diet.' },
  'egg':      { minMonth:7, reason:'Start with well-cooked yolk at 7+ months. White can be more allergenic.' },
  'egg yolk': { minMonth:7, reason:'Can introduce at 7+ months. Cook well. Give alone for 3 days first.' },
  'whole egg': { minMonth:8, reason:'Introduce after egg yolk is tolerated. Cook thoroughly.' },
  'rajma':    { minMonth:8, reason:'Heavy to digest — introduce after 8 months, well-cooked and mashed.' },
  'chana':    { minMonth:9, reason:'Can cause gas — introduce after 9 months, well-cooked.' },
  'chole':    { minMonth:9, reason:'Can cause gas — introduce after 9 months, well-cooked.' },
  'mushroom': { minMonth:10, reason:'Can introduce after 10 months — always well-cooked, never raw.' },
  'corn':     { minMonth:8, reason:'Hard to digest whole. After 8 months, use corn flour or well-mashed sweet corn.' },
  'spinach':  { minMonth:7, reason:'Contains oxalates — blanch before use. Fine from 7 months in small amounts.' },
  'bajra':    { minMonth:7, reason:'A warming millet — better after 7 months, avoid in very hot weather.' },
};

// ── ALLERGEN FLAGS ──
const ALLERGENS = {
  'peanut':    'Tree nut/legume allergen. Introduce alone for 3 days. Watch for rash, swelling, vomiting.',
  'almond':    'Tree nut allergen. Use soaked+peeled+ground. Watch for reactions first 2-3 times.',
  'almonds':   'Tree nut allergen. Use soaked+peeled+ground. Watch for reactions first 2-3 times.',
  'walnut':    'Tree nut allergen. Always grind to paste. Watch for reactions.',
  'cashew':    'Tree nut allergen. Watch for reactions first 2-3 times.',
  'sesame':    'Seed allergen. Start small — ½ tsp ground. Watch for reactions.',
  'til':       'Seed allergen. Start small — ½ tsp ground. Watch for reactions.',
  'soy':       'Common allergen. Start with small amounts.',
  'soybean':   'Common allergen. Start with small amounts.',
  'wheat':     'Contains gluten. Watch for signs of intolerance — bloating, rash, loose stools.',
  'oats':      'May contain traces of gluten. Use certified gluten-free if family has coeliac history.',
  'egg':       'Common allergen. Start with well-cooked yolk. Introduce white separately.',
  'egg yolk':  'Less allergenic than white. Cook well. Give alone for 3 days.',
  'kiwi':      'Can cause mouth tingling. Start with small amount. Watch for oral allergy.',
  'strawberry':'Can cause allergic reaction in some babies. Introduce carefully.',
};

// ── COMBINATION LOGIC ──
const COMBO_RULES = [
  { foods:['iron','calcium'], type:'caution', title:'Iron + Calcium compete for absorption',
    detail:'Calcium can reduce iron absorption by 30-50%. Don\'t serve ragi (iron) with paneer (calcium) in the same meal. Space iron-rich and calcium-rich foods at least 2 hours apart.' },
  { foods:['iron','vitamin c'], type:'boost', title:'Iron + Vitamin C = absorption boost',
    detail:'Vitamin C increases iron absorption by up to 3×. This is an excellent combination! Pair ragi/dal with lemon, tomato, orange, or mango.' },
  { foods:['iron','tea'], type:'avoid', title:'Tea blocks iron absorption',
    detail:'Tannins in tea can reduce iron absorption by 60-80%. Never serve tea to babies.' },
  { foods:['fat','vitamin a'], type:'boost', title:'Fat + Vitamin A = better absorption',
    detail:'Vitamin A is fat-soluble — ghee, coconut oil, or avocado helps absorb it. Great to add ghee to carrot, sweet potato, or pumpkin dishes.' },
  { foods:['probiotic','prebiotic'], type:'boost', title:'Probiotic + Prebiotic = gut health synergy',
    detail:'Curd (probiotic) with banana or oats (prebiotic fibre) feeds the good gut bacteria. Excellent combo!' },
  { foods:['banana','constipation'], type:'caution', title:'Banana can worsen constipation',
    detail:'Ripe banana firms stools. If baby is constipated, replace with pear, papaya, or prune.' },
];
// @@DATA_BLOCK_13_END@@

// @@DATA_BLOCK_14_START@@ COMBO_RECIPES

// ── RECIPE DATABASE (120+ combinations) ──
const COMBO_RECIPES = {
  // ── SINGLE INGREDIENTS ──
  'banana':       { recipe:'1. Peel ¼ ripe banana.\n2. Mash with fork until smooth.\n3. Serve immediately.', dos:['Use ripe bananas with brown spots','Great quick energy snack','Can mix with ragi or curd'], donts:['Don\'t overfeed if stools are firm','Avoid green/unripe bananas','Don\'t store mashed — turns brown'] },
  'avocado':      { recipe:'1. Cut ripe avocado, scoop 2-3 tbsp.\n2. Mash with fork until smooth.\n3. Serve immediately.', dos:['Choose dark, soft avocados','Mix with banana for sweetness','Rich in brain-healthy fats'], donts:['Don\'t heat — loses nutrients','Don\'t store mashed','Avoid unripe hard ones'] },
  'apple':        { recipe:'1. Peel and core ¼ apple.\n2. Steam 5-7 min until very soft.\n3. Mash or puree.\n4. Cool and serve.', dos:['Steam rather than boil','Pair with ragi for iron+VitC','Good for constipation'], donts:['Don\'t serve raw before 8 months','Peel for easier digestion','Don\'t add sugar'] },
  'pear':         { recipe:'1. Peel and core ¼ pear.\n2. Steam 6-8 min until soft.\n3. Mash smooth.\n4. Serve warm.', dos:['Great natural stool softener','Steam to preserve nutrients','Pair after iron meals for VitC'], donts:['Don\'t serve raw before 8 months','Avoid unripe hard pears','Don\'t add sweetener'] },
  'sweet potato': { recipe:'1. Peel 1 small sweet potato, cube.\n2. Steam 10-12 min until very soft.\n3. Mash with fork, add ½ tsp ghee.\n4. Serve warm.', dos:['Rich in Vitamin A','Naturally sweet — babies love it','Add ghee for fat-soluble vitamin absorption'], donts:['Don\'t microwave — steam instead','Introduce alone first','Don\'t add salt'] },
  'pumpkin':      { recipe:'1. Peel and cube 2 tbsp pumpkin.\n2. Steam 8-10 min.\n3. Mash smooth, add ghee.\n4. Can mix with ragi.', dos:['Naturally sweet','Rich in beta-carotene','Easy to digest'], donts:['Remove all seeds and skin','Don\'t use canned pumpkin','Don\'t add sugar'] },
  'curd':         { recipe:'1. Take 2 tbsp fresh homemade curd.\n2. Serve at room temperature.\n3. Can mix with mashed rice or fruit.', dos:['Use homemade curd — freshest probiotics','Great for hot weather','Aids digestion'], donts:['Don\'t heat — kills good bacteria','Room temperature only','Don\'t give chilled from fridge'] },
  'paneer':       { recipe:'1. Take 1 tbsp fresh paneer, crumble.\n2. Steam 3 min to soften.\n3. Mash smooth with fork.\n4. Mix into khichdi or dal.', dos:['Use fresh homemade paneer','Great calcium + protein source','Steam, don\'t fry'], donts:['Avoid market paneer with preservatives','Don\'t fry for babies','Not as a standalone meal — mix with grains'] },
  'egg yolk':     { recipe:'1. Hard boil an egg — 12 min in boiling water.\n2. Remove white completely.\n3. Mash yolk with breast milk or water.\n4. Serve 1 tsp first time.', dos:['Cook thoroughly — no runny yolk','Introduce alone for 3 days','Rich in iron, zinc, choline'], donts:['Don\'t give raw or undercooked','Avoid white initially','Watch for allergic reaction'] },
  'moringa':      { recipe:'1. Wash 10-12 tender moringa (drumstick) leaves.\n2. Blanch in boiling water 2 min.\n3. Puree with 1 tbsp water.\n4. Mix 1 tsp into dal or khichdi.', dos:['Use only tender young leaves','Blanch to reduce bitterness','Iron + calcium powerhouse'], donts:['Don\'t give raw leaves','Start with ½ tsp — strong flavour','Don\'t use mature/woody leaves'] },
  'oats':         { recipe:'1. Grind 1 tbsp oats to powder.\n2. Cook in ½ cup water on low 5 min.\n3. Add mashed fruit + ghee.\n4. Serve warm.', dos:['Use plain rolled oats only','Grind fine for beginners','Good source of iron and fibre'], donts:['Don\'t use flavoured/instant oats','Watch for gluten reaction if family history','Don\'t make too thick initially'] },
  'ragi':         { recipe:'1. Dry roast 1 tbsp ragi flour on low 2 min.\n2. Add ½ cup water, stir continuously.\n3. Cook 5-6 min until thick.\n4. Add ½ tsp ghee, cool slightly.', dos:['Use homemade ragi flour','Pair with VitC fruit for iron absorption','Best iron+calcium grain for babies'], donts:['Don\'t add salt or sugar','Stir continuously to avoid lumps','Don\'t make too thick for beginners'] },

  // ── COMMON COMBOS ──
  'ragi banana':      { recipe:'1. Cook 1 tbsp ragi in ½ cup water (5 min).\n2. Mash ¼ ripe banana.\n3. Mix banana into warm ragi.\n4. Add ½ tsp ghee.', dos:['Great energy + iron breakfast','Banana adds natural sweetness','Add ghee for healthy fats'], donts:['Don\'t overfeed banana if constipated','Stir ragi continuously','Don\'t store — serve fresh'] },
  'ragi apple':       { recipe:'1. Peel+dice ¼ apple, steam 5 min.\n2. Cook 1 tbsp ragi in ½ cup water.\n3. Mix mashed apple into ragi.\n4. Add ghee.', dos:['Apple VitC boosts ragi iron absorption','Perfect breakfast combo','Steam apple until very soft'], donts:['Don\'t use raw apple','Don\'t add sugar','Serve warm'] },
  'dal rice':         { recipe:'1. Wash ½ tbsp moong dal + 1 tbsp rice, soak 30 min.\n2. Pressure cook with 1 cup water, pinch turmeric — 4 whistles.\n3. Mash smooth, add ½ tsp ghee.', dos:['Classic weaning staple','Complete protein + carb meal','Add a boiled veggie for nutrition'], donts:['Don\'t add salt','Mash very smooth for beginners','Don\'t make too thick'] },
  'dal spinach':      { recipe:'1. Blanch 5-6 spinach leaves 2 min, chop fine.\n2. Cook ½ tbsp dal in ½ cup water.\n3. Add spinach, cook 3 more min.\n4. Add ghee + lemon drops.', dos:['Double iron — dal + spinach','Blanch spinach to reduce oxalates','Lemon boosts iron absorption'], donts:['Don\'t use raw spinach','Don\'t reheat — make fresh','Don\'t skip the blanching step'] },
  'curd rice':        { recipe:'1. Cook 1 tbsp rice until very soft.\n2. Cool slightly, mix 1 tbsp fresh curd.\n3. Mash well until creamy.\n4. Serve at room temperature.', dos:['Homemade curd is best','Great for hot weather','Probiotics aid digestion'], donts:['Don\'t heat curd — kills bacteria','Room temperature only','Don\'t add salt'] },
  'paneer rice':      { recipe:'1. Cook 1 tbsp rice until soft.\n2. Crumble 1 tbsp paneer, steam 2 min.\n3. Mash paneer into rice.\n4. Add ghee + pinch turmeric.', dos:['Calcium + protein + carb complete meal','Use fresh paneer','Add a veggie for more nutrition'], donts:['Don\'t fry paneer','Mash smooth for young babies','Don\'t add salt'] },
  'khichdi':          { recipe:'1. Wash 1 tbsp rice + ½ tbsp moong dal, soak 30 min.\n2. Pressure cook with 1 cup water, pinch turmeric — 4 whistles.\n3. Mash, add ghee.', dos:['India\'s perfect first food','Add any boiled vegetable','Complete balanced meal'], donts:['No salt or spices initially','Mash thoroughly','Semi-liquid for beginners'] },
  'avocado banana':   { recipe:'1. Mash 2 tbsp avocado + ¼ banana.\n2. Mix well.\n3. Serve immediately.', dos:['No cooking needed','Brain-healthy fats from both','Under 3 minutes to prepare'], donts:['Make fresh each time','Both oxidise fast','Don\'t blend too smooth — some texture is good'] },
  'carrot beetroot':  { recipe:'1. Grate ½ carrot + ½ beetroot.\n2. Steam 8-10 min until soft.\n3. Mash together, add ghee.', dos:['VitA + iron combo','Beautiful colour — babies enjoy it','Add to khichdi for complete meal'], donts:['Use a bib — beetroot stains!','Pink stools are normal','Don\'t use canned vegetables'] },
  'peanut butter':    { recipe:'1. Dry roast 1 tbsp peanuts.\n2. Grind to absolutely smooth paste with 1 tsp oil.\n3. Mix ½ tsp into porridge or mashed banana.', dos:['Early introduction reduces allergy risk','Always grind completely smooth','Rich in protein + healthy fats'], donts:['NEVER give whole/chunky peanuts','Watch for allergic reaction first 3 days','Start with ½ tsp mixed into food'] },
  'mango curd':       { recipe:'1. Mash 2 tbsp ripe mango.\n2. Mix with 1 tbsp fresh curd.\n3. Serve at room temperature.', dos:['VitC from mango + probiotics from curd','Use only ripe sweet mangoes','Great summer snack'], donts:['Don\'t heat curd','Limit mango — high natural sugar','Use homemade curd'] },
  'sweet potato ghee':{ recipe:'1. Steam cubed sweet potato 10 min.\n2. Mash smooth.\n3. Add ½ tsp ghee, mix well.', dos:['Ghee helps absorb VitA from sweet potato','Naturally sweet — no sugar needed','Great first food'], donts:['Don\'t skip ghee — important for absorption','Don\'t add salt','Steam, don\'t boil'] },
  'idli sambar':      { recipe:'1. Steam mini idlis from homemade batter (10 min).\n2. Make simple dal water — boil moong dal, strain.\n3. Mash idli with dal water.\n4. Add ghee.', dos:['Fermented = natural probiotics','Soft texture — easy on gums','Good protein source'], donts:['Don\'t use spicy sambar','Use plain dal water instead','Homemade batter — no preservatives'] },
  'ragi walnut':      { recipe:'1. Soak 1 walnut overnight, grind to paste.\n2. Cook 1 tbsp ragi in ½ cup water (5 min).\n3. Mix walnut paste + ghee.', dos:['Iron + omega-3 combo','Walnut is best plant omega-3','Soak overnight for easier grinding'], donts:['Never give walnut pieces','Watch for nut allergy first 2-3 times','Don\'t add sugar'] },
  'banana walnut':    { recipe:'1. Soak 1 walnut 2 hrs, grind to paste.\n2. Mash ¼ banana.\n3. Mix together, serve immediately.', dos:['Quick brain food snack','Energy + omega-3','Under 5 minutes'], donts:['Always grind walnut to paste','Use ripe bananas only','Don\'t store — serve fresh'] },
  'cheese paratha':   { recipe:'1. Grate 1 tbsp cheese into whole wheat dough.\n2. Roll thin paratha.\n3. Cook on tawa with ghee until soft.\n4. Tear into small pieces for baby.', dos:['Calcium + protein + carbs','Use mild, fresh cheese','Cook until very soft'], donts:['Avoid processed cheese slices','No salt in dough','Tear into tiny pieces — choking risk'] },
  'dal rice ghee':    { recipe:'1. Cook moong dal + rice together — pressure cook 4 whistles.\n2. Mash smooth.\n3. Add ½ tsp ghee + pinch turmeric.\n4. Can add a boiled veggie.', dos:['The holy trinity of Indian baby food','Ghee adds brain-healthy fats','Add lemon for iron absorption'], donts:['No salt or spices for young babies','Mash thoroughly','Don\'t skip the ghee'] },
  'ragi date':        { recipe:'1. Soak 1 date 30 min, deseed, mash.\n2. Cook 1 tbsp ragi in ½ cup water (5 min).\n3. Mix in date paste + ghee.', dos:['Iron from both ragi and dates','Natural sweetness — no sugar needed','Excellent breakfast option'], donts:['Always deseed completely','Don\'t use more than 1 date','Don\'t add additional sweetener'] },
  'pear avocado':     { recipe:'1. Steam ¼ pear 5 min until soft.\n2. Mash with 2 tbsp avocado.\n3. Serve at room temperature.', dos:['Best combo when slightly constipated','Healthy fats + fibre','Don\'t heat avocado — mash cold'], donts:['Serve immediately — browns fast','Don\'t skip steaming the pear','Not a complete meal — serve with grains too'] },
  'oats banana':      { recipe:'1. Grind 1 tbsp oats to powder.\n2. Cook in ½ cup water (5 min).\n3. Mash ¼ banana, mix in.\n4. Add ghee.', dos:['Iron + energy breakfast','Oats fibre is gentle on tummy','Add cinnamon pinch after 8 months'], donts:['Use plain oats only','Don\'t use flavoured packets','Grind fine for first few times'] },
  'carrot moong dal': { recipe:'1. Grate ½ carrot.\n2. Wash ½ tbsp moong dal, soak 20 min.\n3. Pressure cook together with ¾ cup water — 3 whistles.\n4. Mash, add ghee + turmeric.', dos:['VitA + protein combo','Carrot adds natural sweetness','Gentle on tummy'], donts:['Don\'t add salt','Mash very smooth','Cook until very soft'] },
  'beetroot masoor dal':{ recipe:'1. Grate 1 small beetroot.\n2. Wash ½ tbsp masoor dal, soak 20 min.\n3. Pressure cook with ¾ cup water — 3 whistles.\n4. Mash, add ghee + lemon drops.', dos:['Double iron powerhouse','Lemon doubles iron absorption','One of the best iron combos'], donts:['Pink/red stools are normal — not blood','Don\'t skip lemon if possible','Don\'t add salt'] },
  'almond date ghee': { recipe:'1. Soak 4 almonds overnight, peel.\n2. Soak 1 date 30 min, deseed.\n3. Grind together to smooth paste.\n4. Mix ½ tsp ghee. Serve 1 tsp at a time.', dos:['Concentrated nutrition — small portions','Can store in fridge 2 days','Iron + calcium + brain fats'], donts:['Don\'t give more than 1 tsp per serving','Grind to absolutely smooth paste','Deseed date completely'] },
  'ragi beetroot':    { recipe:'1. Grate 1 small beetroot, steam 5 min, puree.\n2. Cook 1 tbsp ragi in ½ cup water (5 min).\n3. Mix beetroot puree into ragi.\n4. Add ghee.', dos:['Double iron sources combined','Pair with lemon or mango for absorption','Rich colour — visually appealing'], donts:['Will stain everything pink','Don\'t add salt','Serve fresh'] },
  'blueberry avocado':{ recipe:'1. Steam 10 blueberries 2 min, mash.\n2. Scoop 2 tbsp avocado.\n3. Mix together.\n4. Serve immediately.', dos:['Brain fats + antioxidants','No cooking needed','Rich purple colour'], donts:['Don\'t give whole blueberries','Both oxidise fast — serve immediately','Stains heavily — bib essential'] },
  'spinach khichdi':  { recipe:'1. Blanch 5-6 spinach leaves 2 min, puree.\n2. Cook 1 tbsp rice + ½ tbsp dal — 3 whistles.\n3. Mix spinach puree + ghee + lemon.', dos:['Triple iron — spinach + dal + lemon for absorption','Blanch spinach first to reduce oxalates','Complete meal'], donts:['Don\'t reheat spinach dishes','Don\'t skip blanching','Make fresh each time'] },
  'honey':            { recipe:'', dos:[], donts:['NEVER give honey before 12 months','Risk of infant botulism — can be fatal','No form of honey is safe — raw, cooked, or baked'] },
  'salt':             { recipe:'', dos:[], donts:['No added salt before 12 months','Baby\'s kidneys cannot process it','Natural sodium in food is sufficient'] },
  'sugar':            { recipe:'', dos:[], donts:['No added sugar before 12 months','Use fruit for natural sweetness','Includes jaggery and gur'] },
};
// @@DATA_BLOCK_14_END@@

// @@DATA_BLOCK_15_START@@ FOOD_SUBCATS

// ── Sub-category food classification for recipe generation ──
const FOOD_SUBCATS = {
  // Grains
  porridge:    { match:['ragi','oats','dalia','bajra','jowar','suji','barley','amaranth','wheat porridge','makki','sattu'], cook:'porridge', time:'5–8 min', method:'Cook in water on low, stirring often' },
  khichdi:     { match:['khichdi'], cook:'pressure', time:'3–4 whistles', method:'Pressure cook with water' },
  fermented:   { match:['idli','dosa','uttapam','pongal','appam'], cook:'steam/griddle', time:'8–12 min', method:'Steam (idli) or cook on low-heat tawa' },
  flatbread:   { match:['roti','chapati','paratha','thepla','jowar roti','bajra roti'], cook:'griddle', time:'2–3 min/side', method:'Roll soft, cook on tawa with ghee' },
  flaked:      { match:['poha','rice flakes'], cook:'soak+sauté', time:'5 min', method:'Soak 5 min, sauté with vegetables' },
  tapioca:     { match:['sabudana','sago'], cook:'soak+cook', time:'soak 4h + 5 min', method:'Soak 4 hours, then cook until translucent' },
  // Lentils
  dal:         { match:['moong dal','masoor dal','toor dal','chana dal','urad dal','mixed dal','dal tadka','dal fry','dal palak'], cook:'pressure', time:'3–4 whistles', method:'Wash, soak 20 min, pressure cook' },
  dalSoup:     { match:['dal soup','rasam','sambar'], cook:'boil', time:'15–20 min', method:'Boil dal, add tempering' },
  legume:      { match:['rajma','chole','chickpea','lobia','green peas'], cook:'pressure', time:'5–6 whistles', method:'Soak overnight, pressure cook until very soft' },
  sprout:      { match:['sprout','moong sprout'], cook:'steam', time:'8–10 min', method:'Steam until soft, mash or puree' },
  // Fruits — soft (no cook)
  softFruit:   { match:['banana','avocado','papaya','mango','chiku','sapota','custard apple','sitaphal','jackfruit'], cook:'none', time:'0 min', method:'Peel ripe fruit, mash with fork' },
  // Fruits — need steaming
  firmFruit:   { match:['apple','pear','peach','plum','prune','apricot','guava','amla'], cook:'steam', time:'5–8 min', method:'Peel, core, steam until fork-tender, mash' },
  // Fruits — juicy (serve raw)
  juicyFruit:  { match:['orange','mosambi','watermelon','muskmelon','grapes','strawberry','blueberry','raspberry','cherry','pomegranate','pineapple','kiwi','dragon fruit','passion fruit','litchi','jamun','fig','date','cranberry'], cook:'raw', time:'0 min', method:'Wash, peel/deseed, mash or cut small' },
  // Dried fruit
  driedFruit:  { match:['dried fig','dried apricot','date puree','prune puree','raisin'], cook:'soak', time:'soak 2h', method:'Soak in warm water 2 hours, then mash smooth' },
  // Root vegetables
  rootVeg:     { match:['potato','sweet potato','yam','suran','arbi','colocasia','raw banana','kachha kela','beetroot','carrot','turnip','radish','lotus root'], cook:'steam/boil', time:'12–15 min', method:'Peel, cube, steam until fork-tender' },
  // Gourd vegetables
  gourdVeg:    { match:['bottle gourd','lauki','ridge gourd','tori','bitter gourd','karela','snake gourd','ash gourd','petha','ivy gourd','tindora','pointed gourd','parwal','zucchini','pumpkin'], cook:'steam', time:'8–10 min', method:'Peel, deseed, cube, steam until soft' },
  // Leafy greens
  leafy:       { match:['spinach','palak','methi','fenugreek','amaranth leaves','chaulai','mustard greens','sarson','bathua','moringa','drumstick leaves','coriander leaves'], cook:'blanch', time:'2–3 min', method:'Wash 3–4 times, blanch in boiling water, puree' },
  // Cruciferous/other veg
  cruciferous: { match:['broccoli','cauliflower','cabbage'], cook:'steam', time:'8–10 min', method:'Break into small florets, steam until very soft' },
  // Other vegetables
  otherVeg:    { match:['beans','peas','corn','capsicum','bell pepper','tomato','onion','garlic','ginger','mushroom','cucumber','banana stem'], cook:'steam/sauté', time:'8–12 min', method:'Wash, chop small, steam or sauté in ghee' },
  // Dairy
  curd:        { match:['curd','dahi','yogurt','raita','buttermilk','chaas'], cook:'none', time:'0 min', method:'Serve at room temperature, never heat' },
  paneer:      { match:['paneer','cheese','cottage cheese'], cook:'steam', time:'3 min', method:'Crumble, steam briefly, mash smooth' },
  milkFat:     { match:['ghee','butter','makhan','cream','malai'], cook:'none', time:'0 min', method:'Add ½ tsp to cooked food — do not cook separately' },
  kheer:       { match:['kheer','payasam','sheera'], cook:'simmer', time:'15–20 min', method:'Simmer grain in milk on low heat, stir often' },
  // Nuts & seeds
  nut:         { match:['almond','walnut','cashew','peanut','pistachio'], cook:'soak+grind', time:'soak 4–6h', method:'Soak, peel, grind to very fine paste with water' },
  seed:        { match:['sesame','til','flaxseed','alsi','chia','pumpkin seed','sunflower seed','makhana','fox nut'], cook:'roast+powder', time:'3–5 min', method:'Dry roast on low, cool, grind to fine powder' },
  // Spices
  spice:       { match:['turmeric','jeera','cumin','ajwain','cinnamon','cardamom','nutmeg','pepper','hing','saffron','fennel','mint','curry leaves','bay leaf','ginger'], cook:'temper', time:'30 sec', method:'Add tiny pinch to cooked food or temper in ghee' },
  sweetener:   { match:['jaggery','gur','mishri','date syrup'], cook:'dissolve', time:'1 min', method:'Dissolve small amount in warm food — avoid before 12 months' },
  // Oils
  oil:         { match:['coconut oil','sesame oil','mustard oil','olive oil','groundnut oil'], cook:'none', time:'0 min', method:'Add ½ tsp to cooked food for healthy fats' },
  // Non-veg
  egg:         { match:['egg yolk','egg','boiled egg'], cook:'boil', time:'12 min', method:'Hard boil 12 min, remove white, mash yolk smooth' },
  chicken:     { match:['chicken'], cook:'pressure', time:'4–5 whistles', method:'Pressure cook boneless pieces until very tender, shred/puree' },
  fish:        { match:['fish'], cook:'steam', time:'10–12 min', method:'Steam boneless fillets, flake carefully checking for bones' },
  mutton:      { match:['mutton'], cook:'pressure', time:'6–7 whistles', method:'Pressure cook with water until falling apart, puree for soup' },
  // Prepared dishes
  soup:        { match:['soup','broth'], cook:'boil', time:'20–25 min', method:'Boil ingredients in water, strain or blend smooth' },
};
// @@DATA_BLOCK_15_END@@

// @@DATA_BLOCK_16_START@@ VARIETY_TARGETS


// ─────────────────────────────────────────
// FOOD VARIETY & GROUP COVERAGE
// ─────────────────────────────────────────

const VARIETY_TARGETS = { 6: 8, 7: 10, 8: 12, 9: 14, 10: 15, 11: 15, 12: 18 };
// @@DATA_BLOCK_16_END@@

// @@DATA_BLOCK_17_START@@ GROUP_SUGGESTIONS + SUB_SUGGESTIONS

const GROUP_SUGGESTIONS = {
  grains: 'Try ragi porridge, dalia khichdi, or jowar roti',
  fruits: 'Offer banana, papaya, or seasonal fruit like chiku or guava',
  vegs: 'Try carrot purée, pumpkin mash, or beetroot with curd',
  dairy: 'Add ghee to meals, or try paneer fingers or curd rice',
  nuts: 'Try almond paste in porridge, makhana, or sesame powder',
  nonveg: 'Try egg yolk mash or soft fish',
  spices: 'Add a pinch of jeera, haldi, or hing to dal',
};
const SUB_SUGGESTIONS = {
  'vegs:leafy': 'Palak dal, methi paratha, or drumstick leaves soup',
  'vegs:roots': 'Carrot sticks, sweet potato mash, or beetroot rice',
  'fruits:berries': 'Mashed blueberries or strawberry purée',
};
// @@DATA_BLOCK_17_END@@

// @@DATA_BLOCK_18_START@@ SEASONAL_AVAILABILITY

// ════════════════════════════════════════
// UIB SESSION 2: SEASONAL + ACCEPTANCE + OUTING + HYDRATION
// ════════════════════════════════════════

// ── Seasonal Availability Database (Jamshedpur, Jharkhand) ──
var SEASONAL_AVAILABILITY = {
  // availability: 'peak' (abundant/cheap), 'available' (findable), 'scarce' (hard/expensive), 'unavailable'
  // month indices: 0=Jan, 11=Dec
  // Year-round staples
  'banana':       { months:[0,1,2,3,4,5,6,7,8,9,10,11], availability:'peak' },
  'rice':         { months:[0,1,2,3,4,5,6,7,8,9,10,11], availability:'peak' },
  'ragi':         { months:[0,1,2,3,4,5,6,7,8,9,10,11], availability:'peak' },
  'potato':       { months:[0,1,2,3,4,5,6,7,8,9,10,11], availability:'peak' },
  'ghee':         { months:[0,1,2,3,4,5,6,7,8,9,10,11], availability:'peak' },
  'curd':         { months:[0,1,2,3,4,5,6,7,8,9,10,11], availability:'peak' },
  'almonds':      { months:[0,1,2,3,4,5,6,7,8,9,10,11], availability:'peak' },
  'walnut':       { months:[0,1,2,3,4,5,6,7,8,9,10,11], availability:'peak' },
  'date (fruit)': { months:[0,1,2,3,4,5,6,7,8,9,10,11], availability:'peak' },
  'masoor dal':   { months:[0,1,2,3,4,5,6,7,8,9,10,11], availability:'peak' },
  'moong dal':    { months:[0,1,2,3,4,5,6,7,8,9,10,11], availability:'peak' },
  'paneer':       { months:[0,1,2,3,4,5,6,7,8,9,10,11], availability:'peak' },
  'oats':         { months:[0,1,2,3,4,5,6,7,8,9,10,11], availability:'peak' },
  'flaxseed':     { months:[0,1,2,3,4,5,6,7,8,9,10,11], availability:'peak' },
  'sesame':       { months:[0,1,2,3,4,5,6,7,8,9,10,11], availability:'peak' },
  // Summer (Mar-Jun)
  'mango':        { months:[3,4,5,6], availability:'peak' },
  'watermelon':   { months:[3,4,5,6], availability:'peak' },
  'muskmelon':    { months:[3,4,5,6], availability:'peak' },
  'litchi':       { months:[4,5,6], availability:'peak' },
  'jackfruit':    { months:[4,5,6,7], availability:'peak' },
  'bottle gourd': { months:[2,3,4,5,6,7], availability:'peak', other:'available' },
  'lauki':        { months:[2,3,4,5,6,7], availability:'peak', other:'available' },
  'cucumber':     { months:[3,4,5,6,7,8], availability:'peak' },
  'coconut water':{ months:[2,3,4,5,6,7,8,9], availability:'peak' },
  // Monsoon (Jul-Sep)
  'jamun':        { months:[5,6,7], availability:'peak' },
  'guava':        { months:[7,8,9,10,11], availability:'peak' },
  'drumstick':    { months:[1,2,3,7,8,9], availability:'peak', other:'available' },
  'moringa':      { months:[1,2,3,7,8,9], availability:'peak', other:'available' },
  'corn':         { months:[6,7,8,9], availability:'peak' },
  // Winter (Nov-Feb)
  'apple':        { months:[7,8,9,10], availability:'peak', other:'available' },
  'pear':         { months:[7,8,9,10], availability:'peak', other:'available' },
  'orange':       { months:[10,11,0,1,2], availability:'peak' },
  'amla':         { months:[10,11,0,1], availability:'peak' },
  'spinach':      { months:[10,11,0,1,2], availability:'peak' },
  'peas':         { months:[10,11,0,1,2], availability:'peak' },
  'sweet potato': { months:[10,11,0,1,2,3], availability:'peak' },
  'cauliflower':  { months:[10,11,0,1], availability:'peak' },
  'broccoli':     { months:[10,11,0,1], availability:'peak', other:'scarce' },
  'strawberry':   { months:[11,0,1,2], availability:'available' },
  // Transitional
  'carrot':       { months:[10,11,0,1,2], availability:'peak', other:'available' },
  'beetroot':     { months:[10,11,0,1,2,3], availability:'peak', other:'available' },
  'avocado':      { months:[0,1,2,3,4,5,6,7,8,9,10,11], availability:'available' },
  'blueberry':    { months:[0,1,2,3,4,5,6,7,8,9,10,11], availability:'available' },
  'blackberry':   { months:[4,5,6], availability:'available' },
  'papaya':       { months:[0,1,2,3,4,5,6,7,8,9,10,11], availability:'peak' },
  'coconut':      { months:[0,1,2,3,4,5,6,7,8,9,10,11], availability:'peak' }
};
// @@DATA_BLOCK_18_END@@

// @@DATA_BLOCK_19_START@@ PORTABLE_PREP_TIPS

// ── Outing Briefing Popup ──

var PORTABLE_PREP_TIPS = {
  'banana': 'Mash fresh just before leaving \u2014 browns quickly once mashed',
  'avocado': 'Mash and store in airtight container with lemon drop to prevent browning. Consume within 2 hours.',
  'ragi': 'Ragi ladoo or ragi porridge in thermos \u2014 stays warm 3+ hours',
  'date (fruit)': 'Date + nut energy balls can be pre-made. Travel well at room temp.',
  'apple': 'Stew apple pieces at home, carry in airtight container. Do not carry raw slices for baby.',
  'khichdi': 'Carry in a thermos \u2014 stays warm and safe for 3\u20134 hours. Pack spoon separately.',
  'curd': 'Only if outing < 2 hours and weather < 30\u00B0C. Spoils quickly in heat.',
  'idli': 'Soft idli travels well. Pair with sambar in a separate thermos.'
};
// @@DATA_BLOCK_19_END@@

// @@DATA_BLOCK_20_START@@ MILESTONE_STANDARDS

// WHO Motor Development Study + WHO developmental milestones
const MILESTONE_STANDARDS = {
  who: {
  6: [
    { text:'Sits without support for extended periods', icon:zi('baby'), desc:'Can sit steadily on the floor without toppling — core strength is building.', advanced:false, cat:'motor' },
    { text:'Starts raking grasp', icon:zi('baby'), desc:'Uses whole hand to scoop small objects. Precursor to the pincer grasp.', advanced:false, cat:'motor' },
    { text:'Transfers objects between hands', icon:zi('hourglass'), desc:'Passes a toy from one hand to the other — shows bilateral brain coordination.', advanced:false, cat:'motor' },
    { text:'Recognises familiar faces vs strangers', icon:zi('baby'), desc:'May show preference for known caregivers and wariness of new faces.', advanced:false, cat:'social' },
    { text:'Begins consonant babbling (ba-ba, da-da)', icon:zi('chat'), desc:'Repetitive consonant-vowel combos appear — early speech building blocks.', advanced:false, cat:'language' },
    { text:'Pulls to stand from sitting', icon:zi('run'), desc:'Uses furniture or hands to pull up to standing — shows exceptional leg strength.', advanced:true, cat:'motor' },
    { text:'Crawls or commando crawls', icon:zi('baby'), desc:'Some babies begin crawling at 6 months — most do by 8–9 months. Commando (belly) crawling counts.', advanced:true, cat:'motor' },
  ],
  7: [
    { text:'Crawling (hands and knees)', icon:zi('baby'), desc:'Classic crawling emerges — some babies skip this and scoot or shuffle instead. All are normal.', advanced:false, cat:'motor' },
    { text:'Sits independently with good balance', icon:zi('lotus'), desc:'Can sit, lean, reach for toys without falling — trunk control is solid.', advanced:false, cat:'motor' },
    { text:'Responds to own name consistently', icon:zi('baby'), desc:'Turns head reliably when name is called — sign of language comprehension developing.', advanced:false, cat:'language' },
    { text:'Understands "no" (tone)', icon:zi('warn'), desc:'Pauses or looks when you say "no" firmly — understands tone before words.', advanced:false, cat:'cognitive' },
    { text:'Finger feeding begins', icon:zi('spoon'), desc:'Picks up puffs or soft finger foods and brings to mouth — fine motor + self-feeding.', advanced:false, cat:'motor' },
    { text:'Waves bye-bye', icon:zi('baby'), desc:'Imitates waving — a social communication milestone. Usually 7–9 months.', advanced:false, cat:'social' },
    { text:'Stands holding furniture (cruising prep)', icon:zi('run'), desc:'Pulls up and stands while holding furniture for support. Legs bear full weight.', advanced:true, cat:'motor' },
    { text:'Says mama/dada (non-specific)', icon:zi('chat'), desc:'Uses mama/dada sounds but not yet directed at the right person. Specific use is 10–12 months.', advanced:true, cat:'language' },
  ],
  8: [
    { text:'Pincer grasp developing', icon:zi('baby'), desc:'Begins using thumb and forefinger to pick up small items — a major fine motor milestone.', advanced:false, cat:'motor' },
    { text:'Cruising (walks holding furniture)', icon:zi('run'), desc:'Moves sideways along furniture while holding on — building balance for walking.', advanced:false, cat:'motor' },
    { text:'Separation anxiety peaks', icon:zi('baby'), desc:'Cries when primary caregiver leaves — sign of strong attachment, not a problem.', advanced:false, cat:'social' },
    { text:'Object permanence strengthens', icon:zi('star'), desc:'Searches for hidden toys — understands things exist even when out of sight.', advanced:false, cat:'cognitive' },
    { text:'Claps hands', icon:zi('baby'), desc:'Brings palms together intentionally — motor planning + social imitation.', advanced:false, cat:'social' },
    { text:'Points at objects', icon:zi('baby'), desc:'Uses index finger to point — early communication milestone, usually 8–12 months.', advanced:true, cat:'language' },
    { text:'Stands momentarily without support', icon:zi('run'), desc:'Lets go of furniture and balances for a few seconds — pre-walking confidence.', advanced:true, cat:'motor' },
  ],
  9: [
    { text:'Pincer grasp refined', icon:zi('baby'), desc:'Neat thumb-forefinger grip for picking up small items like puffs and peas.', advanced:false, cat:'motor' },
    { text:'Pulls to stand easily', icon:zi('run'), desc:'Gets from sitting to standing with minimal effort — leg and core strength well developed.', advanced:false, cat:'motor' },
    { text:'Understands simple words', icon:zi('book'), desc:'Looks at correct object when you say "ball", "bottle", etc. — receptive language growing.', advanced:false, cat:'language' },
    { text:'Stranger anxiety may ease', icon:zi('baby'), desc:'Becomes more social again after the 8-month anxiety peak.', advanced:false, cat:'social' },
    { text:'Bangs objects together purposefully', icon:zi('star'), desc:'Deliberately hits two toys together — cause-and-effect understanding deepens.', advanced:false, cat:'cognitive' },
    { text:'First steps (with support)', icon:zi('run'), desc:'Takes steps while holding hands or pushing a walker — early walking readiness.', advanced:true, cat:'motor' },
    { text:'Says mama/dada with meaning', icon:zi('chat'), desc:'Uses "mama" for mother and "dada" for father specifically — true first words.', advanced:true, cat:'language' },
    { text:'Follows simple instructions', icon:zi('list'), desc:'"Give me the ball" or "come here" — understands and acts on one-step commands.', advanced:true, cat:'cognitive' },
  ],
  10: [
    { text:'Stands alone briefly', icon:zi('run'), desc:'Balances without holding anything for several seconds.', advanced:false, cat:'motor' },
    { text:'Cruise confidently', icon:zi('run'), desc:'Moves quickly along furniture, may let go briefly.', advanced:false, cat:'motor' },
    { text:'Uses gestures (shaking head, reaching)', icon:zi('baby'), desc:'Communicates wants through gestures — bridges gap before words.', advanced:false, cat:'language' },
    { text:'Stacks 2 blocks', icon:zi('baby'), desc:'Places one block on another — spatial awareness + hand steadiness.', advanced:false, cat:'cognitive' },
    { text:'Walks independently', icon:zi('run'), desc:'Takes several steps without holding anything. Average age is 12 months, but 10–15 months is all normal.', advanced:true, cat:'motor' },
    { text:'Says 1–2 words beyond mama/dada', icon:zi('chat'), desc:'May say "hi", "no", "bye" or a pet name. True words with consistent meaning.', advanced:true, cat:'language' },
  ],
  11: [
    { text:'Walks with one hand held', icon:zi('handshake'), desc:'Confident walking while holding just one of your hands.', advanced:false, cat:'motor' },
    { text:'Drinks from a cup (with help)', icon:zi('drop'), desc:'Takes sips from an open cup when held — oral motor coordination developing.', advanced:false, cat:'motor' },
    { text:'Puts objects into containers', icon:zi('note'), desc:'Drops toys into a box deliberately — understanding of "in" and "out".', advanced:false, cat:'cognitive' },
    { text:'Imitates actions', icon:'🪞', desc:'Copies clapping, stirring, phone-to-ear — social learning through observation.', advanced:false, cat:'social' },
    { text:'Walks independently', icon:zi('run'), desc:'Many babies walk between 11–13 months — wide range is completely normal.', advanced:false, cat:'motor' },
    { text:'Says 3–5 words', icon:zi('chat'), desc:'Small vocabulary of meaningful words. Understands far more than she speaks.', advanced:true, cat:'language' },
  ],
  12: [
    { text:'Walks independently', icon:zi('run'), desc:'Most babies walk by 12–15 months. Steady gait develops over the following months.', advanced:false, cat:'motor' },
    { text:'Says 2–3 words with meaning', icon:zi('chat'), desc:'Uses specific words consistently. Receptive vocabulary is 10–50+ words.', advanced:false, cat:'language' },
    { text:'Follows one-step instructions', icon:zi('list'), desc:'"Bring the shoe", "sit down" — understands and acts on simple requests.', advanced:false, cat:'cognitive' },
    { text:'Uses spoon (messily)', icon:zi('spoon'), desc:'Attempts self-feeding with a spoon — will be messy but is great for independence.', advanced:false, cat:'motor' },
    { text:'Plays peek-a-boo independently', icon:zi('baby'), desc:'Initiates peek-a-boo or hiding games — shows social play and memory.', advanced:false, cat:'social' },
    { text:'Scribbles with crayon', icon:zi('palette'), desc:'Makes marks on paper when given a crayon — early fine motor + creative expression.', advanced:true, cat:'motor' },
    { text:'Says 5+ words', icon:zi('chat'), desc:'Expanding vocabulary with clear intent. May combine a word + gesture.', advanced:true, cat:'language' },
    { text:'Runs (toddles fast)', icon:zi('run'), desc:'Moves at speed once walking is stable — balance and coordination accelerating.', advanced:true, cat:'motor' },
  ],
  },

  // IAP / DASII — Indian Academy of Pediatrics developmental guidelines
  iap: {
  6: [
    { text:'Rolls both ways freely', icon:zi('hourglass'), desc:'Rolls from back to tummy and back without effort — good trunk rotation.', advanced:false, cat:'motor' },
    { text:'Sits with support (tripod sitting)', icon:zi('baby'), desc:'Sits using hands for balance on the floor — IAP expects this by 6m.', advanced:false, cat:'motor' },
    { text:'Reaches and grasps objects', icon:zi('baby'), desc:'Accurately reaches for and grabs a rattle or toy placed nearby.', advanced:false, cat:'motor' },
    { text:'Turns to sound source', icon:zi('baby'), desc:'Locates and turns toward a voice or sound — auditory processing milestone.', advanced:false, cat:'language' },
    { text:'Stranger awareness begins', icon:zi('baby'), desc:'Shows discomfort or hesitation with unfamiliar people.', advanced:false, cat:'social' },
    { text:'Enjoys peekaboo', icon:zi('baby'), desc:'Laughs and anticipates during peekaboo games — early social cognition.', advanced:false, cat:'cognitive' },
    { text:'Sits without support', icon:zi('lotus'), desc:'Sits independently without hand support — ahead of IAP 7m expectation.', advanced:true, cat:'motor' },
  ],
  7: [
    { text:'Sits without support steadily', icon:zi('lotus'), desc:'IAP expects stable independent sitting by 7 months.', advanced:false, cat:'motor' },
    { text:'Bounces when held in standing', icon:zi('run'), desc:'Bears weight on legs and bounces actively when held upright.', advanced:false, cat:'motor' },
    { text:'Transfers objects hand to hand', icon:zi('hourglass'), desc:'Deliberately passes toys between hands — bilateral coordination.', advanced:false, cat:'motor' },
    { text:'Babbles chains of syllables', icon:zi('chat'), desc:'Produces strings like "ba-ba-ba" or "ma-ma-ma" — canonical babbling.', advanced:false, cat:'language' },
    { text:'Looks for dropped objects', icon:zi('baby'), desc:'Tracks and searches for a toy that falls — early object permanence.', advanced:false, cat:'cognitive' },
    { text:'Shows affection to caregivers', icon:zi('baby'), desc:'Reaches for parents, nuzzles, or vocalizes happily when held.', advanced:false, cat:'social' },
    { text:'Crawls on belly', icon:zi('baby'), desc:'Commando crawling — pulling forward using arms. Early mobility.', advanced:true, cat:'motor' },
  ],
  8: [
    { text:'Gets to sitting position independently', icon:zi('baby'), desc:'Can move from lying to sitting without help — core strength + motor planning.', advanced:false, cat:'motor' },
    { text:'Crawling on hands and knees', icon:zi('baby'), desc:'IAP expects crawling by 8–9 months. Some babies scoot instead — equally valid.', advanced:false, cat:'motor' },
    { text:'Pincer grasp emerging', icon:zi('baby'), desc:'Starts picking up small objects with thumb and forefinger.', advanced:false, cat:'motor' },
    { text:'Responds to own name', icon:zi('baby'), desc:'Consistently turns when name is called — receptive language milestone.', advanced:false, cat:'language' },
    { text:'Separation anxiety intensifies', icon:zi('baby'), desc:'Strong protest when parent leaves — peak of attachment behaviour, normal and healthy.', advanced:false, cat:'social' },
    { text:'Explores objects by mouthing, shaking, banging', icon:zi('scope'), desc:'Uses multiple senses to understand objects — scientific exploration phase.', advanced:false, cat:'cognitive' },
    { text:'Pulls to stand', icon:zi('run'), desc:'Uses furniture to pull up to standing — strong legs and determination.', advanced:true, cat:'motor' },
  ],
  9: [
    { text:'Pulls to stand on furniture', icon:zi('run'), desc:'IAP expects pulling to stand by 9 months — a key gross motor milestone.', advanced:false, cat:'motor' },
    { text:'Refined pincer grasp', icon:zi('baby'), desc:'Clean thumb-index finger pick up of small items like cereal pieces.', advanced:false, cat:'motor' },
    { text:'Says "mama" or "dada" (non-specific)', icon:zi('chat'), desc:'Produces these sounds but not yet with specific meaning — IAP 9m expectation.', advanced:false, cat:'language' },
    { text:'Understands "no"', icon:zi('warn'), desc:'Pauses activity when told "no" — comprehension developing.', advanced:false, cat:'cognitive' },
    { text:'Plays pat-a-cake', icon:zi('baby'), desc:'Claps along to rhymes — social imitation + motor coordination.', advanced:false, cat:'social' },
    { text:'Points with index finger', icon:zi('baby'), desc:'Uses pointing to communicate interest — proto-declarative pointing.', advanced:false, cat:'language' },
    { text:'Cruises along furniture', icon:zi('run'), desc:'Walks sideways holding furniture — balance building for independent walking.', advanced:true, cat:'motor' },
  ],
  10: [
    { text:'Stands with support confidently', icon:zi('run'), desc:'Stands holding furniture with good balance and one hand free.', advanced:false, cat:'motor' },
    { text:'Feeds self with fingers', icon:zi('spoon'), desc:'Picks up and eats small pieces of food independently.', advanced:false, cat:'motor' },
    { text:'Waves bye-bye', icon:zi('baby'), desc:'IAP expects social waving by 10 months.', advanced:false, cat:'social' },
    { text:'Imitates gestures', icon:'🪞', desc:'Copies actions like clapping, stirring, phone to ear.', advanced:false, cat:'social' },
    { text:'Understands simple commands', icon:zi('list'), desc:'"Give it to me", "come here" — acts on one-step requests.', advanced:false, cat:'cognitive' },
    { text:'Stands momentarily alone', icon:zi('run'), desc:'Lets go and balances for a few seconds independently.', advanced:true, cat:'motor' },
    { text:'Says 1–2 words with meaning', icon:zi('chat'), desc:'Consistent use of a word for the right thing — true language begins.', advanced:true, cat:'language' },
  ],
  11: [
    { text:'Cruises well', icon:zi('run'), desc:'Moves confidently along furniture, may use one hand.', advanced:false, cat:'motor' },
    { text:'Puts objects into container', icon:zi('note'), desc:'Drops toys into a cup or box deliberately.', advanced:false, cat:'cognitive' },
    { text:'Says "mama/dada" with meaning', icon:zi('chat'), desc:'IAP expects specific use of mama/dada by 11 months.', advanced:false, cat:'language' },
    { text:'Cooperates with dressing', icon:zi('baby'), desc:'Extends arm for sleeve or lifts foot for shoe — body awareness.', advanced:false, cat:'social' },
    { text:'Walks with one hand held', icon:zi('handshake'), desc:'Takes steps while holding one of your hands.', advanced:false, cat:'motor' },
    { text:'Walks independently', icon:zi('run'), desc:'Some babies walk by 11 months — wide range of normal.', advanced:true, cat:'motor' },
  ],
  12: [
    { text:'Walks independently or with minimal support', icon:zi('run'), desc:'IAP expects walking by 12–15 months. Both early and later walkers are normal.', advanced:false, cat:'motor' },
    { text:'Says 2–3 words with meaning', icon:zi('chat'), desc:'Small but real vocabulary with consistent meanings.', advanced:false, cat:'language' },
    { text:'Drinks from cup with help', icon:zi('drop'), desc:'Takes sips from an open cup when held.', advanced:false, cat:'motor' },
    { text:'Follows simple instructions', icon:zi('list'), desc:'"Sit down", "give me" — one-step commands understood and followed.', advanced:false, cat:'cognitive' },
    { text:'Shows objects to others', icon:zi('baby'), desc:'Holds up a toy to show you — shared attention, a key social milestone.', advanced:false, cat:'social' },
    { text:'Uses spoon (attempts)', icon:zi('spoon'), desc:'Tries to self-feed with spoon — messy but shows independence.', advanced:true, cat:'motor' },
    { text:'Says 4+ words', icon:zi('chat'), desc:'Growing vocabulary beyond mama/dada — IAP advanced for 12m.', advanced:true, cat:'language' },
  ],
  },

  // Euro-Growth / ASQ-based European developmental milestones
  eu: {
  6: [
    { text:'Rolls from back to tummy', icon:zi('hourglass'), desc:'Can roll over in both directions — core strength milestone.', advanced:false, cat:'motor' },
    { text:'Sits with minimal support', icon:zi('baby'), desc:'Sits with hands on floor for balance (tripod). Independent sitting by 7m.', advanced:false, cat:'motor' },
    { text:'Reaches for and grasps toys', icon:zi('baby'), desc:'Accurate reaching and voluntary grasp of objects.', advanced:false, cat:'motor' },
    { text:'Vocalises to get attention', icon:zi('chat'), desc:'Uses sounds deliberately to call a caregiver or express needs.', advanced:false, cat:'language' },
    { text:'Laughs and squeals', icon:zi('baby'), desc:'Full belly laughs and high-pitched squeals during play.', advanced:false, cat:'social' },
    { text:'Explores objects with mouth', icon:zi('baby'), desc:'Brings everything to mouth — primary exploration method at this age.', advanced:false, cat:'cognitive' },
    { text:'Sits independently', icon:zi('lotus'), desc:'Sits without any support — ahead of typical European 7m timeline.', advanced:true, cat:'motor' },
  ],
  7: [
    { text:'Sits independently and stable', icon:zi('lotus'), desc:'European guidelines expect stable sitting by 7 months.', advanced:false, cat:'motor' },
    { text:'Passes toys hand to hand', icon:zi('hourglass'), desc:'Transfers objects between hands — midline crossing skill.', advanced:false, cat:'motor' },
    { text:'Babbles with consonant sounds', icon:zi('chat'), desc:'Produces repeated syllables like "ba-ba", "da-da" — canonical babbling phase.', advanced:false, cat:'language' },
    { text:'Finds partially hidden toy', icon:zi('star'), desc:'Pulls cloth off a partially covered toy — early object permanence.', advanced:false, cat:'cognitive' },
    { text:'Enjoys social games', icon:zi('brain'), desc:'Actively participates in peekaboo, tickle games — social reciprocity.', advanced:false, cat:'social' },
    { text:'Bears weight on legs when held', icon:zi('run'), desc:'Pushes down actively when held in standing position.', advanced:false, cat:'motor' },
    { text:'Crawls on belly', icon:zi('baby'), desc:'Commando-style forward movement. Some skip this entirely — normal.', advanced:true, cat:'motor' },
  ],
  8: [
    { text:'Crawls on hands and knees', icon:zi('baby'), desc:'Classic quadruped crawling. European expectation is 8–10 months.', advanced:false, cat:'motor' },
    { text:'Develops pincer grasp', icon:zi('baby'), desc:'Picks up small objects between thumb and finger — major fine motor step.', advanced:false, cat:'motor' },
    { text:'Responds to own name', icon:zi('baby'), desc:'Turns reliably when name is called across the room.', advanced:false, cat:'language' },
    { text:'Shows separation anxiety', icon:zi('baby'), desc:'Protests when caregiver leaves — healthy attachment sign.', advanced:false, cat:'social' },
    { text:'Explores cause and effect', icon:zi('scope'), desc:'Drops toys to watch them fall, pushes buttons repeatedly — learning causality.', advanced:false, cat:'cognitive' },
    { text:'Claps hands', icon:zi('baby'), desc:'Brings palms together on purpose — motor planning meets social imitation.', advanced:false, cat:'social' },
    { text:'Pulls to stand', icon:zi('run'), desc:'Uses furniture to pull up — strong for 8 months.', advanced:true, cat:'motor' },
  ],
  9: [
    { text:'Pulls to standing', icon:zi('run'), desc:'European norm expects pull-to-stand by 9–10 months.', advanced:false, cat:'motor' },
    { text:'Pincer grasp well established', icon:zi('baby'), desc:'Neat pickup of small items like raisins, peas — precise fine motor.', advanced:false, cat:'motor' },
    { text:'Uses gestures to communicate', icon:zi('baby'), desc:'Points, reaches, waves — gestural communication before words.', advanced:false, cat:'language' },
    { text:'Finds fully hidden objects', icon:zi('star'), desc:'Searches under cloth for completely hidden toy — full object permanence.', advanced:false, cat:'cognitive' },
    { text:'Shows preference for certain people', icon:zi('star'), desc:'Clear attachment hierarchy — prefers primary caregivers.', advanced:false, cat:'social' },
    { text:'Bangs objects together', icon:zi('star'), desc:'Holds two objects and deliberately bangs them — bilateral coordination.', advanced:false, cat:'motor' },
    { text:'First steps with support', icon:zi('run'), desc:'Takes steps while holding hands or furniture — early for European norms.', advanced:true, cat:'motor' },
  ],
  10: [
    { text:'Cruises along furniture', icon:zi('run'), desc:'Walks sideways holding furniture for support — balance developing.', advanced:false, cat:'motor' },
    { text:'Stands alone briefly', icon:zi('run'), desc:'Lets go and balances for a few seconds.', advanced:false, cat:'motor' },
    { text:'Understands "no" and simple words', icon:zi('book'), desc:'Responds appropriately to familiar words and tone.', advanced:false, cat:'cognitive' },
    { text:'Waves bye-bye', icon:zi('baby'), desc:'Social gesture — learned through imitation.', advanced:false, cat:'social' },
    { text:'Drinks from cup with assistance', icon:zi('drop'), desc:'Takes sips from an open cup when helped.', advanced:false, cat:'motor' },
    { text:'Walks independently', icon:zi('run'), desc:'Some European babies walk by 10 months — on the early side.', advanced:true, cat:'motor' },
    { text:'Says first word', icon:zi('chat'), desc:'One clear word used consistently with meaning.', advanced:true, cat:'language' },
  ],
  11: [
    { text:'Walks with one hand held', icon:zi('handshake'), desc:'Confident walking with one-hand support.', advanced:false, cat:'motor' },
    { text:'Picks up small objects neatly', icon:zi('baby'), desc:'Precise pincer grasp for tiny items — well refined.', advanced:false, cat:'motor' },
    { text:'Imitates adult actions', icon:'🪞', desc:'Copies phone-to-ear, stirring, sweeping — deferred imitation developing.', advanced:false, cat:'cognitive' },
    { text:'Says mama/dada specifically', icon:zi('chat'), desc:'Uses "mama" and "dada" for the correct parent.', advanced:false, cat:'language' },
    { text:'Plays social games independently', icon:zi('brain'), desc:'Initiates peekaboo, pat-a-cake without prompting.', advanced:false, cat:'social' },
    { text:'Walks independently', icon:zi('run'), desc:'European expectation for walking is 11–15 months.', advanced:false, cat:'motor' },
  ],
  12: [
    { text:'Walks independently', icon:zi('run'), desc:'Most European norms expect walking by 12–15 months.', advanced:false, cat:'motor' },
    { text:'Says 2–6 words', icon:zi('chat'), desc:'Small vocabulary with consistent meaning. Understands many more.', advanced:false, cat:'language' },
    { text:'Follows simple instructions', icon:zi('list'), desc:'Acts on one-step commands like "give me the ball".', advanced:false, cat:'cognitive' },
    { text:'Uses spoon (attempts)', icon:zi('spoon'), desc:'Self-feeding with a spoon — messy but developing.', advanced:false, cat:'motor' },
    { text:'Shows objects to share attention', icon:zi('baby'), desc:'Holds up a toy for you to see — joint attention milestone.', advanced:false, cat:'social' },
    { text:'Scribbles when given crayon', icon:zi('palette'), desc:'Makes marks on paper — early fine motor expression.', advanced:true, cat:'motor' },
    { text:'Stacks 2–3 blocks', icon:zi('baby'), desc:'Builds a small tower — hand-eye coordination + spatial awareness.', advanced:true, cat:'cognitive' },
  ],
  },

  // Chinese developmental standards (CIP/Gesell-based)
  cn: {
  6: [
    { text:'Rolls freely in both directions', icon:zi('hourglass'), desc:'Rolls tummy to back and back to tummy smoothly.', advanced:false, cat:'motor' },
    { text:'Sits briefly with hand support', icon:zi('baby'), desc:'Chinese standards expect supported sitting by 6 months.', advanced:false, cat:'motor' },
    { text:'Grasps objects with whole hand', icon:zi('baby'), desc:'Palmar grasp — picks up toys using full hand.', advanced:false, cat:'motor' },
    { text:'Turns toward voice', icon:zi('baby'), desc:'Localises sound and turns head toward the speaker.', advanced:false, cat:'language' },
    { text:'Distinguishes familiar from unfamiliar faces', icon:zi('baby'), desc:'Shows clear preference for caregivers — social cognition developing.', advanced:false, cat:'social' },
    { text:'Mouths and explores objects', icon:zi('baby'), desc:'Primary method of exploring the world — taste and texture.', advanced:false, cat:'cognitive' },
    { text:'Sits independently', icon:zi('lotus'), desc:'Sits without support — early for Chinese 7m standard.', advanced:true, cat:'motor' },
  ],
  7: [
    { text:'Sits independently and stably', icon:zi('lotus'), desc:'Chinese standards expect independent sitting by 7 months.', advanced:false, cat:'motor' },
    { text:'Transfers objects between hands', icon:zi('hourglass'), desc:'Passes toys from one hand to the other deliberately.', advanced:false, cat:'motor' },
    { text:'Babbles syllable chains', icon:zi('chat'), desc:'Produces "ba-ba-ba" or "ma-ma-ma" repetitive syllables.', advanced:false, cat:'language' },
    { text:'Recognises mirror reflection', icon:'🪞', desc:'Shows interest in own reflection — early self-awareness.', advanced:false, cat:'cognitive' },
    { text:'Reaches for familiar people', icon:zi('baby'), desc:'Extends arms to be picked up by caregivers.', advanced:false, cat:'social' },
    { text:'Bears weight on legs', icon:zi('run'), desc:'Bounces and pushes down when held in standing.', advanced:false, cat:'motor' },
    { text:'Crawls on belly', icon:zi('baby'), desc:'Commando crawling — early mobility ahead of 8m standard.', advanced:true, cat:'motor' },
  ],
  8: [
    { text:'Crawls on hands and knees', icon:zi('baby'), desc:'Chinese standard expects crawling by 8–9 months.', advanced:false, cat:'motor' },
    { text:'Pulls to kneeling', icon:zi('run'), desc:'Uses furniture to pull up to kneeling position.', advanced:false, cat:'motor' },
    { text:'Inferior pincer grasp', icon:zi('baby'), desc:'Picks up small objects between thumb and side of index finger.', advanced:false, cat:'motor' },
    { text:'Responds to name', icon:zi('baby'), desc:'Turns consistently when called — language comprehension.', advanced:false, cat:'language' },
    { text:'Stranger anxiety present', icon:zi('baby'), desc:'Shows fear or crying with unfamiliar people — healthy attachment.', advanced:false, cat:'social' },
    { text:'Plays peek-a-boo', icon:zi('baby'), desc:'Anticipates and enjoys the reveal — object permanence + social play.', advanced:false, cat:'cognitive' },
    { text:'Pulls to stand', icon:zi('run'), desc:'Pulls up to standing using furniture — ahead of 9m standard.', advanced:true, cat:'motor' },
  ],
  9: [
    { text:'Pulls to stand on furniture', icon:zi('run'), desc:'Chinese standard expects pulling to stand by 9 months.', advanced:false, cat:'motor' },
    { text:'Superior pincer grasp', icon:zi('baby'), desc:'Neat thumb-tip to index-tip pickup of small items.', advanced:false, cat:'motor' },
    { text:'Says "mama/baba" (non-specific)', icon:zi('chat'), desc:'Produces parent-like sounds without specific meaning yet.', advanced:false, cat:'language' },
    { text:'Understands simple prohibitions', icon:zi('warn'), desc:'Pauses when told "no" or "don\'t touch" — comprehension developing.', advanced:false, cat:'cognitive' },
    { text:'Waves goodbye', icon:zi('baby'), desc:'Social gesture learned through imitation.', advanced:false, cat:'social' },
    { text:'Claps hands on request', icon:zi('baby'), desc:'Claps when asked or when hearing music — motor + social.', advanced:false, cat:'social' },
    { text:'Cruises along furniture', icon:zi('run'), desc:'Steps sideways holding furniture — early for 10m standard.', advanced:true, cat:'motor' },
  ],
  10: [
    { text:'Cruises along furniture', icon:zi('run'), desc:'Chinese standard expects cruising by 10 months.', advanced:false, cat:'motor' },
    { text:'Stands alone momentarily', icon:zi('run'), desc:'Lets go of support and balances briefly.', advanced:false, cat:'motor' },
    { text:'Points to desired objects', icon:zi('baby'), desc:'Uses index finger pointing to communicate wants.', advanced:false, cat:'language' },
    { text:'Imitates simple actions', icon:'🪞', desc:'Copies adult gestures like clapping, waving, phone-to-ear.', advanced:false, cat:'cognitive' },
    { text:'Shows objects to caregiver', icon:zi('baby'), desc:'Holds up toys to show — joint attention and sharing.', advanced:false, cat:'social' },
    { text:'Walks with both hands held', icon:zi('run'), desc:'Takes steps while holding both of your hands.', advanced:false, cat:'motor' },
    { text:'Says first meaningful word', icon:zi('chat'), desc:'One clear word used with intent — early for Chinese 12m standard.', advanced:true, cat:'language' },
  ],
  11: [
    { text:'Walks with one hand held', icon:zi('handshake'), desc:'Steps confidently with single-hand support.', advanced:false, cat:'motor' },
    { text:'Releases objects voluntarily', icon:zi('note'), desc:'Deliberately drops toys into containers — controlled release.', advanced:false, cat:'motor' },
    { text:'Says "mama/baba" specifically', icon:zi('chat'), desc:'Uses parent words for the correct person.', advanced:false, cat:'language' },
    { text:'Cooperates with dressing', icon:zi('baby'), desc:'Extends limbs to help with putting on clothes.', advanced:false, cat:'social' },
    { text:'Finds hidden objects', icon:zi('star'), desc:'Searches under cups and cloths for hidden toys.', advanced:false, cat:'cognitive' },
    { text:'Walks independently', icon:zi('run'), desc:'Some babies walk by 11 months — early for Chinese standard.', advanced:true, cat:'motor' },
  ],
  12: [
    { text:'Walks independently', icon:zi('run'), desc:'Chinese standard expects independent walking by 12–15 months.', advanced:false, cat:'motor' },
    { text:'Says 2–3 meaningful words', icon:zi('chat'), desc:'Small vocabulary used consistently and correctly.', advanced:false, cat:'language' },
    { text:'Follows one-step instructions', icon:zi('list'), desc:'Understands and acts on simple commands.', advanced:false, cat:'cognitive' },
    { text:'Feeds self with fingers', icon:zi('spoon'), desc:'Picks up and eats food pieces independently.', advanced:false, cat:'motor' },
    { text:'Plays simple give-and-take games', icon:zi('brain'), desc:'Hands toy to you and expects it back — social reciprocity.', advanced:false, cat:'social' },
    { text:'Uses spoon (attempts)', icon:zi('spoon'), desc:'Tries to scoop food with a spoon — messy but shows independence.', advanced:true, cat:'motor' },
    { text:'Says 5+ words', icon:zi('chat'), desc:'Rapidly growing vocabulary — advanced for Chinese 12m standard.', advanced:true, cat:'language' },
  ],
  },
};
// @@DATA_BLOCK_20_END@@

// @@DATA_BLOCK_21_START@@ SLEEP_STANDARDS

// ── Sleep Standards per reference ──
const SLEEP_STANDARDS = {
  who: { // WHO sleep guidelines
    nightMin:  { 6:600, 7:600, 8:600, 9:600, 10:600, 11:600, 12:600 },  // 10h floor
    nightTarget: { 6:660, 7:660, 8:660, 9:660, 10:630, 11:630, 12:630 }, // 11h / 10.5h
    totalTarget: { 6:840, 7:840, 8:840, 9:780, 10:780, 11:780, 12:780 }, // 14h / 13h
    totalFloor:  { 6:540, 7:540, 8:540, 9:480, 10:480, 11:480, 12:480 }, // 9h / 8h
    bedtimeStart: 19, bedtimeEnd: 20, // 7–8 PM
    naps: { 6:[2,3], 7:[2,3], 8:[2,3], 9:[2,2], 10:[2,2], 11:[1,2], 12:[1,2] },
    label: 'WHO'
  },
  iap: { // IAP (India) — slightly more flexible on bedtime, adjusted for Indian routines
    nightMin:  { 6:570, 7:570, 8:570, 9:570, 10:570, 11:570, 12:570 },  // 9.5h floor
    nightTarget: { 6:660, 7:660, 8:660, 9:630, 10:630, 11:630, 12:600 }, // 11h / 10.5h / 10h
    totalTarget: { 6:840, 7:840, 8:810, 9:780, 10:780, 11:780, 12:750 }, // 14h → 12.5h
    totalFloor:  { 6:540, 7:540, 8:510, 9:480, 10:480, 11:480, 12:450 },
    bedtimeStart: 20, bedtimeEnd: 21, // 8–9 PM (Indian households tend later)
    naps: { 6:[2,3], 7:[2,3], 8:[2,3], 9:[2,2], 10:[1,2], 11:[1,2], 12:[1,2] },
    label: 'IAP'
  },
  eu: { // European norms — similar to WHO with slight variations
    nightMin:  { 6:600, 7:600, 8:600, 9:600, 10:600, 11:600, 12:570 },
    nightTarget: { 6:660, 7:660, 8:660, 9:660, 10:660, 11:630, 12:630 },
    totalTarget: { 6:840, 7:840, 8:840, 9:810, 10:780, 11:780, 12:780 },
    totalFloor:  { 6:540, 7:540, 8:540, 9:510, 10:480, 11:480, 12:480 },
    bedtimeStart: 19, bedtimeEnd: 20,
    naps: { 6:[2,3], 7:[2,3], 8:[2,3], 9:[2,2], 10:[2,2], 11:[1,2], 12:[1,2] },
    label: 'EU'
  },
  cn: { // Chinese (CIP) — tends to expect slightly less night sleep, more naps
    nightMin:  { 6:570, 7:570, 8:570, 9:540, 10:540, 11:540, 12:540 },  // 9.5h / 9h
    nightTarget: { 6:630, 7:630, 8:630, 9:600, 10:600, 11:600, 12:600 }, // 10.5h / 10h
    totalTarget: { 6:840, 7:840, 8:810, 9:780, 10:780, 11:750, 12:750 },
    totalFloor:  { 6:540, 7:540, 8:510, 9:480, 10:480, 11:450, 12:450 },
    bedtimeStart: 20, bedtimeEnd: 21, // 8–9 PM (Chinese households tend later)
    naps: { 6:[2,3], 7:[2,3], 8:[2,3], 9:[2,3], 10:[2,2], 11:[1,2], 12:[1,2] },
    label: 'CIP'
  },
};
// @@DATA_BLOCK_21_END@@

// @@DATA_BLOCK_22_START@@ MILESTONE_ACTIVITIES
const MILESTONE_ACTIVITIES = {
  // ── Motor ──
  pull_to_stand: [
    { text: 'Supported standing at sofa', duration: 5, icon: 'run', tip: 'Let her pull up on furniture — stay close' },
    { text: 'Standing play at low table', duration: 10, icon: 'run', tip: 'Place toys on a low table to encourage standing' },
  ],
  cruise: [
    { text: 'Cruising along furniture', duration: 5, icon: 'run', tip: 'Place toys along the sofa edge to encourage sideways steps' },
    { text: 'Push walker practice', duration: 10, icon: 'run', tip: 'Hold the walker steady while she pushes' },
  ],
  sit: [
    { text: 'Sitting with toys in reach', duration: 10, icon: 'crystal', tip: 'Place toys just out of reach to encourage balance' },
  ],
  roll: [
    { text: 'Roll practice on mat', duration: 5, icon: 'run', tip: 'Place a toy to one side to motivate rolling' },
  ],
  crawl: [
    { text: 'Crawling obstacle course', duration: 10, icon: 'run', tip: 'Use pillows and cushions as gentle obstacles' },
    { text: 'Chase crawling game', duration: 5, icon: 'run', tip: 'Crawl alongside her — babies love parallel play' },
  ],
  pincer: [
    { text: 'Small food pick-up practice', duration: 10, icon: 'spoon', tip: 'Puffed rice, small pieces — encourage thumb-finger pinch' },
    { text: 'Peel-off sticker play', duration: 10, icon: 'crystal', tip: 'Large stickers on paper — peeling builds pincer grip' },
  ],
  finger_feed: [
    { text: 'Self-feeding finger foods', duration: 10, icon: 'spoon', tip: 'Soft pieces she can pick up — banana, paneer, idli' },
  ],
  bang: [
    { text: 'Banging pots and spoons', duration: 5, icon: 'bell', tip: 'Give her a wooden spoon and a steel plate — rhythm play' },
    { text: 'Block banging game', duration: 5, icon: 'crystal', tip: 'Two blocks — show her how to bang them together' },
  ],
  // ── Language ──
  babble: [
    { text: 'Babble back-and-forth', duration: 5, icon: 'chat', tip: 'When she babbles, respond as if conversation' },
    { text: 'Narrate what you are doing', duration: 10, icon: 'chat', tip: 'Mama is cutting banana. See? Yellow banana!' },
  ],
  mama_dada: [
    { text: 'Name practice — mama/dada', duration: 5, icon: 'chat', tip: 'Point to yourself: Mama! Point to partner: Dada!' },
    { text: 'Photo naming game', duration: 5, icon: 'chat', tip: 'Show family photos, name each person slowly' },
  ],
  first_word: [
    { text: 'Name objects during play', duration: 10, icon: 'chat', tip: 'Point and name: ball, cup, mama' },
    { text: 'Book reading with pointing', duration: 10, icon: 'book', tip: 'Point to pictures, name them, wait for her response' },
  ],
  respond_name: [
    { text: 'Name recognition game', duration: 5, icon: 'chat', tip: 'Call her name from different spots — praise when she turns' },
  ],
  // ── Cognitive ──
  object_permanence: [
    { text: 'Peek-a-boo variations', duration: 5, icon: 'handshake', tip: 'Hide behind a cloth, pop out. Try hiding toys under cups.' },
    { text: 'Find the hidden toy', duration: 10, icon: 'brain', tip: 'Hide a toy under a blanket while she watches — can she find it?' },
  ],
  cause_effect: [
    { text: 'Push-button toy play', duration: 10, icon: 'brain', tip: 'Toys that light up or make sounds when pressed — cause and effect' },
  ],
  stack: [
    { text: 'Block stacking practice', duration: 10, icon: 'brain', tip: 'Start with 2 blocks — celebrate when she stacks them' },
  ],
  // ── Social ──
  separation_anxiety: [
    { text: 'Short separation practice', duration: 5, icon: 'handshake', tip: 'Leave the room briefly, return with a calm greeting' },
    { text: 'Peek-a-boo for attachment', duration: 5, icon: 'handshake', tip: 'Reinforces: I leave but I always come back' },
  ],
  social_game: [
    { text: 'Pat-a-cake together', duration: 5, icon: 'handshake', tip: 'Sing along and clap her hands gently' },
  ],
  wave: [
    { text: 'Wave practice', duration: 2, icon: 'handshake', tip: 'Model waving every time someone arrives or leaves' },
  ],
  clap: [
    { text: 'Clapping songs', duration: 5, icon: 'bell', tip: 'If you are happy and you know it — clap along' },
  ],
  // ── Sensory ──
  sensory_explore: [
    { text: 'Texture board exploration', duration: 10, icon: 'crystal', tip: 'Different textures: rough, smooth, fuzzy, cold' },
    { text: 'Water play in tub', duration: 15, icon: 'drop', tip: 'Cups, spoons, pouring — supervised always' },
  ],
};
// @@DATA_BLOCK_22_END@@

// ─────────────────────────────────────────
// CONSTANTS MIGRATED FROM FEATURE MODULES
// Append this to the end of data.js
// ─────────────────────────────────────────

// From home.js
const MILESTONE_TIDBITS = [
  {
    match: ['rolling'],
    unlocks: 'Ready for more tummy time challenges, reaching across midline, and early pre-crawling moves.',
    doctor: 'Standard 4–6 month screening item. Your paediatrician will be glad to hear this is done.',
    funFact: 'Rolling requires coordination between 8 different muscle groups firing in sequence — it\'s baby\'s first complex motor plan.',
  },
  {
    match: ['sitting independently', 'sits independently', 'sits without support'],
    unlocks: 'Now ready for: high chair meals, floor play without support, two-handed toy play, and early self-feeding.',
    doctor: 'This is a key 6-month checkup item. Sitting frees up both hands — a major cognitive unlock.',
    funFact: 'Independent sitting requires the vestibular system (inner ear balance) to work with 30+ core muscles simultaneously.',
  },
  {
    match: ['teething'],
    unlocks: 'Can start exploring harder textures — teething rings, slightly firmer finger foods, and chilled fruit.',
    doctor: 'Mention any teething discomfort patterns at the next visit. Teeth typically emerge in pairs.',
    funFact: 'Baby teeth actually start forming in the womb at 6 weeks of pregnancy — they\'ve been waiting months to emerge!',
  },
  {
    match: ['sleeps independently'],
    unlocks: 'Self-soothing skill is building. This supports better nap transitions and more predictable sleep patterns.',
    doctor: 'Independent sleep is one of the most asked-about topics at checkups — you\'re ahead of the curve.',
    funFact: 'Babies who self-settle tend to sleep 40–60 minutes longer per night. Sleep consolidation accelerates brain development.',
  },
  {
    match: ['babbling', 'babbl'],
    unlocks: 'Start naming everything she looks at. Respond to her babbles as if they\'re words — this builds conversational turn-taking.',
    doctor: 'Babbling is a key 6-month language marker. Consonant sounds (ba, da, ma) are more significant than vowel-only sounds.',
    funFact: 'Babbling uses 70+ muscles in the face, tongue, and throat. Babies babble in the rhythm patterns of their native language.',
  },
  {
    match: ['responds to name', 'respond'],
    unlocks: 'Can now play name games, simple call-and-response, and early "where\'s Ziva?" peek-a-boo variations.',
    doctor: 'Consistent name response is screened at 9 months. Achieving this early is a strong language comprehension signal.',
    funFact: 'Babies can recognise their own name from as early as 4.5 months, but consistent head-turning takes another 1–2 months of practice.',
  },
  {
    match: ['pulls to stand', 'pull to stand'],
    unlocks: 'Ready for: standing play at a sturdy table, cruising prep along furniture, and supported stepping games.',
    doctor: 'Pulling to stand is typically expected at 8–9 months. Doing this at 6 months is in the top 5–10% — mention it at the next visit.',
    funFact: 'This milestone means her legs can support her full body weight — roughly 4× the load per leg compared to sitting.',
  },
  {
    match: ['crawl', 'commando'],
    unlocks: 'Time for baby-proofing! Crawling opens up: exploration, spatial learning, and bilateral brain coordination.',
    doctor: 'Some babies skip crawling entirely and go straight to cruising — both paths are normal and healthy.',
    funFact: 'Crawling strengthens the corpus callosum — the bridge between left and right brain hemispheres — more than any other infant activity.',
  },
  {
    match: ['transfer', 'hand to hand'],
    unlocks: 'Can now do two-handed play, banging toys together, and early stacking games.',
    doctor: 'Bilateral hand use is a key 6–7 month neurological marker showing both brain hemispheres are communicating well.',
    funFact: 'Hand-to-hand transfer is the foundation for every future fine motor skill — from writing to tying shoelaces.',
  },
  {
    match: ['raking grasp', 'grasp'],
    unlocks: 'Ready for soft finger foods, picking up larger objects, and scooping games during play.',
    doctor: 'Raking grasp is the precursor to the pincer grasp (thumb + forefinger) which typically develops at 8–9 months.',
    funFact: 'The progression from raking to pincer grasp is one of the most studied motor sequences in developmental science.',
  },
  {
    match: ['stranger', 'familiar faces'],
    unlocks: 'Shows healthy attachment forming. Introduce new people gradually — let Ziva warm up at her own pace.',
    doctor: 'Stranger awareness is actually a positive cognitive milestone — it means she can distinguish familiar from unfamiliar.',
    funFact: 'Babies can distinguish their mother\'s face from others within hours of birth, but active stranger wariness peaks around 8 months.',
  },
  {
    match: ['consonant babbling', 'ba-ba', 'da-da'],
    unlocks: 'Start exaggerating sounds back to her. "Ba-ba" games build phoneme recognition — the building blocks of words.',
    doctor: 'Consonant-vowel babbling is more developmentally significant than vowel-only cooing. Report the specific sounds you hear.',
    funFact: 'Deaf babies babble with their hands at the same age hearing babies babble vocally — it\'s a universal brain pattern.',
  },
  {
    match: ['finger feed'],
    unlocks: 'Can progress to varied textures, self-feeding practice, and baby-led weaning finger foods.',
    doctor: 'Self-feeding is both a motor and cognitive milestone — it shows hand-eye coordination, cause-effect, and intentionality.',
    funFact: 'Babies who finger-feed early tend to be less picky eaters at age 2 — the tactile experience builds food acceptance.',
  },
  {
    match: ['wave', 'bye-bye'],
    unlocks: 'Ready for more social gestures — clapping, high-fives, and blowing kisses. These build communication before words.',
    doctor: 'Waving is a social milestone that shows imitation and intentional communication — typically expected by 9 months.',
    funFact: 'Waving bye-bye requires understanding that a gesture carries meaning — this is the same cognitive leap that later enables pointing and eventually words.',
  },
  {
    match: ['pincer'],
    unlocks: 'Ready for: small finger foods (peas, puffs), picking up small toys, early crayon/chalk holding.',
    doctor: 'The pincer grasp is a hallmark 9-month milestone. Your paediatrician will specifically test for this.',
    funFact: 'The pincer grasp is unique to primates. It requires precise coordination between the brain\'s motor cortex and just two fingers.',
  },
  {
    match: ['cruising', 'walks holding furniture'],
    unlocks: 'Time for push toys, walking while holding hands, and furniture arranged as a "cruising track."',
    doctor: 'Cruising is the bridge between standing and walking. Average cruising age is 8–10 months.',
    funFact: 'While cruising, babies make 2,000+ micro-balance adjustments per minute — more than most adults make in an hour.',
  },
  {
    match: ['separation anxiety'],
    unlocks: 'Practice short separations with a calm goodbye routine. A transitional object (soft toy) can help.',
    doctor: 'Separation anxiety peaks at 8–10 months and is a sign of healthy attachment, not a regression.',
    funFact: 'Object permanence drives separation anxiety — she now knows you exist even when she can\'t see you, and wants you back!',
  },
  {
    match: ['object permanence'],
    unlocks: 'Ready for hiding games, peek-a-boo variations, and finding toys under blankets.',
    doctor: 'Object permanence is a Piagetian milestone that marks the transition from sensorimotor to early symbolic thinking.',
    funFact: 'Before object permanence develops, babies literally believe things cease to exist when hidden — "out of sight, out of mind" is real.',
  },
  {
    match: ['clap'],
    unlocks: 'Can now learn pat-a-cake, rhythm games, and action songs. Clapping builds motor planning and social timing.',
    doctor: 'Clapping is both a motor and social milestone — it shows she can imitate a complex two-handed action on cue.',
    funFact: 'Clapping in rhythm activates the same brain regions as language processing — music and speech share neural real estate.',
  },
  {
    match: ['point'],
    unlocks: 'Pointing unlocks joint attention — follow her point and name what she\'s looking at. This accelerates vocabulary.',
    doctor: 'Pointing is one of the strongest predictors of language development. Paediatricians specifically screen for this at 12 months.',
    funFact: 'Pointing is uniquely human among primates in its communicative intent — even chimps rarely point to share interest.',
  },
  {
    match: ['mama', 'dada', 'first word'],
    unlocks: 'Respond enthusiastically when she uses words correctly. Expand her phrases — if she says "da", say "yes, dada!"',
    doctor: 'Specific mama/dada (directed at the right parent) is expected by 10–12 months. Non-specific use is normal at 7–9 months.',
    funFact: 'Babies say "dada" before "mama" in most languages — not because of preference, but because "d" is an easier consonant to produce.',
  },
  {
    match: ['walk', 'first step', 'steps'],
    unlocks: 'Time for first shoes (soft-soled only), outdoor exploration on grass, and push-pull toys.',
    doctor: 'Walking range is 9–16 months with average at 12 months. Late walkers often have stronger crawling skills.',
    funFact: 'A new walker falls an average of 17 times per hour and covers the length of 7 football fields per day!',
  },
  {
    match: ['stack', 'block'],
    unlocks: 'Can progress to nesting cups, simple puzzles, and shape sorters. Spatial reasoning is developing.',
    doctor: 'Stacking 2 blocks is a 12-month cognitive marker. Each additional block stacked maps to months of fine motor progress.',
    funFact: 'Block stacking requires the brain to calculate gravity, balance, and spatial alignment — it\'s baby engineering.',
  },
  {
    match: ['follow', 'instruction', 'one-step'],
    unlocks: 'Can now help with simple tasks — "bring the shoe," "put it in the box." Builds independence and language.',
    doctor: 'Following one-step commands is a 12-month language comprehension milestone, distinct from speaking words.',
    funFact: 'By 12 months, babies understand 50+ words even if they can only say 2–3 — receptive language far outpaces expressive.',
  },
  {
    match: ['spoon', 'self-feed'],
    unlocks: 'Progress to thicker foods, loaded spoons, and eventually fork practice. Messy meals = learning.',
    doctor: 'Self-feeding with a spoon shows motor planning, hand-eye coordination, and cognitive sequencing.',
    funFact: 'It takes about 1,000 attempts for a toddler to master spoon-to-mouth without spilling. Every mess is practice.',
  },
];

// From medical.js
const VACC_GUIDANCE = {
  _default: {
    dos: [
      'Keep the vaccination card updated and safe',
      'Give extra breastfeed/fluids after vaccination',
      'Dress baby in loose clothing on vaccination day',
      'Monitor for 15–20 min at the clinic after the injection',
    ],
    donts: [
      'Don\'t give paracetamol unless the doctor specifically advises it',
      'Don\'t apply ice or any cream on the injection site',
      'Don\'t skip or delay vaccinations without medical advice',
      'Don\'t panic over mild fever (up to 101°F) — it\'s the immune system responding',
    ],
    whenToCall: 'Contact your paediatrician if: fever exceeds 102°F, lasts >48 hours, the injection site swells significantly, or baby is inconsolable.',
  },
  'dtw': {
    dos: ['Mild fever and fussiness are common for 1–2 days — this is normal', 'A small lump at the injection site may form and is harmless'],
    donts: ['Don\'t massage the injection site', 'Don\'t give aspirin — only paracetamol if advised'],
    note: 'DTwP (whole cell) may cause more fever than DTaP (acellular). DTaP is gentler but costs more. Both are equally effective.',
  },
  'rotavirus': {
    dos: ['This is an oral vaccine — no injection', 'Baby can eat/breastfeed normally after'],
    donts: ['Don\'t worry if baby spits up a small amount — the dose still counts', 'Don\'t re-administer if baby vomits — inform the doctor'],
    note: 'Given as drops, not injection. Very rarely causes intussusception — watch for severe crying, blood in stool, or vomiting in the week after.',
  },
  'bcg': {
    dos: ['A small blister/scar at the injection site is expected and desired — it means the vaccine worked', 'The scar may take 2–6 months to fully form'],
    donts: ['Don\'t cover the injection site with bandage', 'Don\'t apply anything on the blister/scar'],
    note: 'Protects against severe forms of TB (meningitis, miliary TB). The scar is a lifelong marker of vaccination.',
  },
  'mmr': {
    dos: ['Mild rash 7–10 days after is common and harmless', 'Slight fever around day 7–12 is expected'],
    donts: ['Don\'t delay this vaccine over unfounded concerns — MMR is extensively studied and safe', 'Don\'t give MMR if baby has a severe egg allergy (discuss with doctor)'],
    note: 'First dose at 9 months, booster at 15 months. Protects against measles (the most contagious disease), mumps, and rubella.',
  },
  'pcv': {
    dos: ['May cause slight fussiness — normal', 'Can be given alongside other vaccines safely'],
    donts: ['Don\'t skip — pneumonia is a leading cause of infant mortality in India'],
    note: 'Protects against pneumococcal bacteria that cause pneumonia, meningitis, and ear infections.',
  },
  'ipv': {
    dos: ['Can be given alongside OPV safely', 'Part of the global polio eradication effort'],
    donts: ['Don\'t confuse with OPV (oral drops) — both are needed'],
    note: 'IPV is the injectable polio vaccine. Along with OPV (oral), provides complete protection against all three poliovirus types.',
  },
  'influenza': {
    dos: ['First time: two doses 4 weeks apart, then annual booster', 'Best given before flu season (Sep–Nov in India)'],
    donts: ['Don\'t skip the second dose if this is the first year', 'Don\'t assume flu is harmless for babies — complications can be serious'],
    note: 'IAP recommended (not mandatory). Protects against seasonal influenza which can be severe in babies under 2.',
  },
  'hep': {
    dos: ['Birth dose is critical — should be given within 24 hours', 'No special precautions needed after this vaccine'],
    donts: ['Don\'t delay the birth dose — early protection against hepatitis B is essential'],
    note: 'Hepatitis B can cause chronic liver disease. The birth dose prevents mother-to-child transmission.',
  },
  'hib': {
    dos: ['Usually given as part of a combination vaccine — no extra injection needed', 'Mild soreness at site is normal'],
    donts: ['Don\'t skip — Hib meningitis has a high mortality rate in unvaccinated infants'],
    note: 'Protects against Haemophilus influenzae type b which causes meningitis, pneumonia, and epiglottitis.',
  },
  'tcv': {
    dos: ['Single dose at 6 months provides long-lasting protection', 'Can be given with other vaccines'],
    donts: ['Don\'t skip if living in an area with poor sanitation — typhoid risk is real'],
    note: 'Conjugate vaccine against typhoid fever. IAP recommended from 6 months onwards.',
  },
  'mcv': {
    dos: ['Critical for preventing meningococcal meningitis', 'Can be given at 9 months with MMR'],
    donts: ['Don\'t skip — meningococcal disease progresses very rapidly'],
    note: 'Protects against Neisseria meningitidis which causes bacterial meningitis and septicaemia.',
  },
  'opv': {
    dos: ['Oral drops — easy and painless', 'Continue giving OPV even during pulse polio campaigns'],
    donts: ['Don\'t breastfeed for 30 minutes before/after OPV (some guidelines)', 'Don\'t skip government pulse polio rounds'],
    note: 'Oral polio vaccine provides intestinal immunity. Works alongside IPV for complete protection.',
  },
};

// From medical.js
const SYMPTOM_DB = [
  {
    id: 'fever-high',
    keywords: ['fever','temperature','hot','burning up','102','103','104','105','high fever'],
    severity: 'emergency',
    title: 'High Fever',
    condition: function(q, mo) { return mo < 3 || q.match(/10[3-5]|above 102|very high|burning/i); },
    whatToDo: 'Give paracetamol (Calpol) only if prescribed by your doctor. Sponge with lukewarm water (never cold). Keep Ziva lightly dressed. Breastfeed frequently to prevent dehydration.',
    precautions: 'Do NOT give aspirin. Do NOT use ice or cold water for sponging. Do NOT over-bundle. Monitor every 30 minutes.',
    emergency: 'Seek immediate medical attention if: fever exceeds 102\u00B0F (under 6 months) or 104\u00B0F (over 6 months), lasts more than 24 hours, is accompanied by rash, stiff neck, difficulty breathing, or Ziva is unusually limp or unresponsive.',
    callDoctor: true
  },
  {
    id: 'fever-mild',
    keywords: ['fever','temperature','warm','low grade','99','100','101','mild fever'],
    severity: 'warning',
    title: 'Mild Fever (99\u2013101\u00B0F)',
    whatToDo: 'Monitor temperature every 2 hours. Keep Ziva comfortable and lightly dressed. Offer breast milk or fluids frequently. A mild fever after vaccination is normal for 1\u20132 days.',
    precautions: 'Watch for escalation above 102\u00B0F. Note if fever came within 48 hours of vaccination (usually normal). Track other symptoms like rash, vomiting, or fussiness.',
    emergency: 'Call doctor if fever persists beyond 48 hours, rises above 102\u00B0F, or is accompanied by lethargy, refusal to feed, or rash.',
    callDoctor: false
  },
  {
    id: 'vomiting',
    keywords: ['vomiting','vomit','throwing up','projectile','spitting up','spit up'],
    severity: 'warning',
    title: 'Vomiting',
    whatToDo: 'Keep Ziva upright for 20\u201330 minutes after feeding. Offer small, frequent feeds instead of large ones. If breastfeeding, continue normally. Avoid introducing new foods until vomiting stops.',
    precautions: 'Track frequency \u2014 occasional spit-up is normal, repeated forceful vomiting is not. Watch for signs of dehydration: fewer wet diapers, dry mouth, no tears, sunken fontanelle.',
    emergency: 'Seek immediate care if: vomiting is projectile or contains blood/bile (green), Ziva shows signs of dehydration, vomiting persists more than 12 hours, or is accompanied by high fever or lethargy.',
    callDoctor: true
  },
  {
    id: 'diarrhoea',
    keywords: ['diarrhoea','diarrhea','loose stool','watery stool','loose motion','runny poop','frequent poop'],
    severity: 'warning',
    title: 'Diarrhoea / Loose Stools',
    whatToDo: 'Continue breastfeeding \u2014 it helps fight infection. Offer ORS (Oral Rehydration Solution) in small sips if prescribed. Avoid fruit juices. Keep the diaper area clean and dry to prevent rash.',
    precautions: 'Count wet diapers to monitor hydration (minimum 6/day is normal). Check for blood or mucus in stool. Avoid anti-diarrhoeal medicines unless prescribed. Wash hands thoroughly before handling food.',
    emergency: 'Call doctor immediately if: blood or mucus in stool, fewer than 4 wet diapers in 24 hours, sunken eyes or fontanelle, Ziva is unusually lethargic, or diarrhoea lasts more than 48 hours.',
    callDoctor: true
  },
  {
    id: 'rash',
    keywords: ['rash','spots','bumps','red skin','hives','eczema','patches','blotchy','itchy','redness'],
    severity: 'warning',
    title: 'Skin Rash',
    whatToDo: 'Note when the rash appeared and what Ziva ate or was exposed to in the previous 24\u201348 hours. Keep the area clean and dry. Avoid scratching \u2014 use mittens if needed. Apply a mild, fragrance-free moisturizer for dry patches.',
    precautions: 'If a new food was introduced recently, this could be a food allergy \u2014 stop that food and note it. Avoid harsh soaps or new detergents. Do NOT apply any cream without doctor\u2019s advice.',
    emergency: 'Seek immediate care if: rash spreads rapidly, is accompanied by swelling of face/lips/tongue, difficulty breathing, or Ziva seems very unwell. Hives with breathing difficulty = possible anaphylaxis \u2014 call emergency immediately.',
    callDoctor: true
  },
  {
    id: 'cough-cold',
    keywords: ['cough','cold','runny nose','stuffy nose','congestion','sneeze','sneezing','blocked nose','mucus','phlegm','nasal'],
    severity: 'mild',
    title: 'Cold / Cough / Congestion',
    whatToDo: 'Use saline nasal drops (Nasivion Mini) before feeds to clear the nose. Run a humidifier in the room. Elevate the head end of the mattress slightly. Offer warm breast milk frequently. Gentle steam inhalation (hold Ziva in a steamy bathroom for 5\u201310 minutes).',
    precautions: 'Do NOT give OTC cough or cold medicines to babies. Do NOT use Vicks or menthol products. Avoid exposure to cigarette smoke. Keep room well-ventilated but not too cold.',
    emergency: 'Call doctor if: breathing becomes rapid or laboured (look for chest retractions), wheezing, blue tint around lips or nails, cough persists more than 7 days, or Ziva refuses to feed.',
    callDoctor: false
  },
  {
    id: 'breathing',
    keywords: ['breathing','breathless','wheeze','wheezing','chest','gasping','noisy breathing','rapid breathing','laboured'],
    severity: 'emergency',
    title: 'Breathing Difficulty',
    whatToDo: 'Keep Ziva upright. Clear the nose with saline drops and a nasal aspirator. Stay calm. Count breaths per minute (normal: 30\u201350 for 6\u201312 months).',
    precautions: 'Look for: chest retracting with each breath, flaring nostrils, grunting sounds, blue tint around lips. These are signs of serious respiratory distress.',
    emergency: 'THIS IS AN EMERGENCY if you see chest retractions, blue lips, or more than 60 breaths per minute. Call your doctor immediately or go to the nearest emergency room.',
    callDoctor: true
  },
  {
    id: 'not-eating',
    keywords: ['not eating','refusing food','won\'t eat','lost appetite','no appetite','refusing feed','rejecting','fussy eating','food refusal','not hungry'],
    severity: 'mild',
    title: 'Refusing Food / Poor Appetite',
    whatToDo: 'Don\u2019t force-feed. Offer small portions of favourite foods. Continue breastfeeding. Check for teething (swollen gums, drooling) which commonly reduces appetite. Try again in 30\u201360 minutes.',
    precautions: 'Track how long the refusal lasts. 1\u20132 meals is normal during teething or minor illness. Check for mouth sores or thrush (white patches inside mouth). Monitor wet diapers for hydration.',
    emergency: 'Call doctor if: refusal lasts more than 24 hours, combined with fever or lethargy, fewer wet diapers, or Ziva seems in pain while swallowing.',
    callDoctor: false
  },
  {
    id: 'teething',
    keywords: ['teething','teeth','gum','gums','drooling','biting','chewing','swollen gum'],
    severity: 'mild',
    title: 'Teething Discomfort',
    whatToDo: 'Offer a clean, chilled teething ring. Gently massage gums with a clean finger. Cold fruit puree (chilled banana or apple) can soothe gums. Wipe drool frequently to prevent chin rash.',
    precautions: 'Do NOT use teething gels containing benzocaine or lidocaine. Do NOT give homeopathic teething tablets. Mild fever (up to 100.4\u00B0F) can accompany teething but high fever is NOT caused by teething \u2014 investigate other causes.',
    emergency: 'Call doctor if: fever exceeds 101\u00B0F (teething alone doesn\u2019t cause high fever), gums bleed or look infected, or Ziva is inconsolable for hours.',
    callDoctor: false
  },
  {
    id: 'constipation',
    keywords: ['constipation','constipated','hard stool','no poop','straining','pellet','not pooping','painful poop','hasn\'t pooped'],
    severity: 'mild',
    title: 'Constipation',
    whatToDo: 'Increase water intake between meals. Offer high-fibre foods: prune puree, pear, papaya, sweet potato. Gentle tummy massage in clockwise circles. Bicycle leg movements can help.',
    precautions: 'Do NOT use suppositories or laxatives without doctor\u2019s advice. A breastfed baby may go 3\u20135 days without pooping \u2014 this is normal if stools are soft when they come. Hard, pellet-like stools are the real concern.',
    emergency: 'Call doctor if: no stool for 5+ days with visible discomfort, blood in stool, abdomen is hard/distended, or Ziva is in obvious pain.',
    callDoctor: false
  },
  {
    id: 'crying-fussy',
    keywords: ['crying','fussy','irritable','cranky','inconsolable','screaming','colic','unsettled','won\'t stop crying','fussiness'],
    severity: 'mild',
    title: 'Excessive Crying / Fussiness',
    whatToDo: 'Check for common causes: hunger, wet diaper, tiredness, temperature (too hot/cold), teething. Try: swaddling, gentle rocking, white noise, skin-to-skin contact. Feed if due. Check for hair tourniquet (strand of hair wrapped around fingers/toes).',
    precautions: 'Note when crying is worst \u2014 evening fussiness (5\u20138 PM) is common at this age. Track if it\u2019s associated with feeding (could be reflux or food sensitivity).',
    emergency: 'Seek care if: crying is high-pitched and unlike normal crying, accompanied by fever or vomiting, Ziva draws legs up to abdomen (possible intussusception), or nothing calms her for more than 3 hours.',
    callDoctor: false
  },
  {
    id: 'eye-issue',
    keywords: ['eye','eyes','watery eye','sticky eye','discharge','red eye','swollen eye','pink eye','conjunctivitis','crusty'],
    severity: 'warning',
    title: 'Eye Discharge / Redness',
    whatToDo: 'Clean gently with a cotton ball soaked in cooled boiled water, wiping from inner to outer corner. Use a fresh cotton ball for each wipe and each eye. Breastmilk drops in the eye can help mild cases (2 drops, 3\u20134 times a day).',
    precautions: 'Wash hands before and after cleaning. Do NOT share towels. A blocked tear duct (common in babies) causes watery/sticky discharge without redness and usually resolves by 12 months.',
    emergency: 'Call doctor if: redness with thick yellow/green discharge (possible bacterial infection), swelling around the eye, Ziva rubs eyes constantly, or vision seems affected.',
    callDoctor: true
  },
  {
    id: 'ear-issue',
    keywords: ['ear','ears','ear pain','pulling ear','tugging ear','ear infection','ear discharge','ear wax'],
    severity: 'warning',
    title: 'Ear Pain / Pulling',
    whatToDo: 'Ear-pulling alone is often just exploration at this age. But if combined with fever, fussiness, or difficulty sleeping, it may indicate an ear infection. Keep Ziva\u2019s head elevated during sleep.',
    precautions: 'Do NOT insert anything into the ear canal. Do NOT use ear drops without prescription. Note if ear-pulling started after a cold (ear infections often follow upper respiratory infections).',
    emergency: 'Call doctor if: fluid or pus draining from the ear, ear-pulling with fever above 101\u00B0F, Ziva is inconsolable especially when lying down, or hearing seems affected.',
    callDoctor: true
  },
  {
    id: 'fall-injury',
    keywords: ['fall','fell','hit head','bump','bruise','injury','dropped','tumble','rolled off','fell off'],
    severity: 'emergency',
    title: 'Fall / Head Injury',
    whatToDo: 'Stay calm. Apply a cold compress (wrapped in cloth) to any bump for 10\u201315 minutes. Observe Ziva closely for the next 24 hours. Let her rest but check on her every 2 hours if sleeping.',
    precautions: 'Minor bumps from rolling or crawling height are usually not serious. Watch for: unusual drowsiness, repeated vomiting, unequal pupils, difficulty waking, clear fluid from nose/ears.',
    emergency: 'SEEK IMMEDIATE CARE if: loss of consciousness (even brief), vomiting more than once, seizure, clear fluid from nose/ears, unequal pupil size, Ziva is unusually sleepy and hard to wake, or the fall was from more than 3 feet.',
    callDoctor: true
  },
  {
    id: 'allergy',
    keywords: ['allergy','allergic','swelling','swollen','hives','anaphylaxis','reaction','food allergy','lip swelling','tongue swelling'],
    severity: 'emergency',
    title: 'Allergic Reaction',
    whatToDo: 'Stop the suspected food immediately. Note what was eaten and when symptoms started. For mild hives: cool compress can help. Do NOT give antihistamines without doctor\u2019s advice for babies.',
    precautions: 'If a new food was introduced, mark it as \u201Cwatch\u201D in the app. Do NOT re-introduce the suspected food without medical guidance. Take a photo of any rash for the doctor.',
    emergency: 'CALL EMERGENCY (or go to ER) IMMEDIATELY if: swelling of lips, tongue, or throat; difficulty breathing or swallowing; Ziva becomes limp or unresponsive. This could be anaphylaxis and requires immediate medical intervention.',
    callDoctor: true
  },
  {
    id: 'dehydration',
    keywords: ['dehydration','dehydrated','dry mouth','no tears','sunken','fontanelle','fewer diapers','dark urine','dry lips','not peeing'],
    severity: 'emergency',
    title: 'Signs of Dehydration',
    whatToDo: 'Offer breast milk or ORS frequently in small amounts. If breastfed, nurse more often. Keep track of wet diapers \u2014 aim for at least 6 in 24 hours.',
    precautions: 'Signs to watch: dry mouth/lips, sunken fontanelle (soft spot on head), no tears when crying, dark concentrated urine, fewer than 4 wet diapers in 24 hours.',
    emergency: 'Seek immediate medical attention if: sunken fontanelle, no wet diaper for 6+ hours, Ziva is lethargic or unusually sleepy, dry mouth with no tears, or skin doesn\u2019t spring back when gently pinched.',
    callDoctor: true
  },
  {
    id: 'sleep-issue',
    keywords: ['not sleeping','sleep','insomnia','waking up','restless','won\'t sleep','night waking','sleep regression'],
    severity: 'mild',
    title: 'Sleep Disturbance',
    whatToDo: 'Check for obvious causes: teething, hunger, wet diaper, temperature, overtiredness. Maintain a consistent bedtime routine. Ensure the room is dark, cool (24\u201326\u00B0C), and quiet.',
    precautions: 'Sleep regressions are common at 6, 8\u201310, and 12 months and typically last 2\u20134 weeks. Developmental leaps (learning to crawl, stand) can disrupt sleep temporarily. Avoid screens 1 hour before bed.',
    emergency: 'Call doctor if: sleep disruption is accompanied by fever, breathing issues, or inconsolable crying. Snoring or gasping during sleep should be evaluated.',
    callDoctor: false
  }
];

// From home.js
const ESCALATING_TIPS = {
  'no-feed-today': [
    'Even partial meals matter — log what she\'s had so far to track her intake pattern.',
    'If appetite is low, try smaller, more frequent offerings. Teething or illness can suppress hunger temporarily.',
    'Repeated low intake days this month. If Ziva is consistently refusing meals, discuss with your paediatrician at the next visit.',
  ],
  'poop-gap': [
    'Tummy massage (clockwise circles), warm bath, high-fibre foods (pear, prune, papaya), and tummy time can help stimulate bowel movement.',
    'Try increasing water between meals and adding more fibre-rich foods like pear, papaya, and oats. Reduce binding foods like banana and rice.',
    'Poop gaps keep recurring. If accompanied by discomfort, hard belly, or straining, this warrants a paediatrician conversation about dietary adjustments.',
  ],
  'hard-stool-streak': [
    'Offer pear, papaya, prune purée, and extra water between meals. Reduce banana and rice if constipation persists. Tummy massage and bicycle legs can also help.',
    'Persistent hard stools despite dietary changes. Try adding ghee to meals (lubricates digestion), increase dal water, and ensure adequate hydration.',
    'Hard stools keep coming back. This pattern has occurred multiple times — consider asking your paediatrician about stool softeners or a dietary review.',
  ],
  'sleep-score-drop': [
    'Stick to consistent bedtime routine, keep the room dark, and avoid new sleep associations. Most regressions pass in 2-4 weeks.',
    'Check if bedtime has shifted later, if naps are too long or too close to bedtime, or if teething/illness might be the cause. Consider an earlier bedtime by 15-30 min.',
    'Sleep quality has dropped repeatedly. If this persists beyond 3-4 weeks, it may not be a typical regression — discuss sleep patterns with your paediatrician.',
  ],
  'food-reaction': [
    'Don\'t panic — many babies have digestive adjustment to new foods. Watch for rash, vomiting, or persistent diarrhoea. If symptoms worsen, pause the new food and try again in a week.',
    'This is the second time a new food has coincided with unusual poop. Consider introducing foods more slowly (one every 4-5 days) and keeping a closer food-reaction diary.',
    'Multiple food reactions flagged. Discuss with your paediatrician — they may recommend an elimination approach or allergy testing if reactions are consistent.',
  ],
  'poop-gap-nodata': [
    'Aim to log at least once a day. Note colour and consistency for the most useful patterns.',
  ],
  'dev-checkup-due': [
    'Prepare questions about feeding, sleep, and any concerns. Bring vaccination records. The doctor will check weight, height, head circumference, and developmental milestones.',
  ],
  'food-variety-stale': [
    'Introduce one new food at a time with a 3-day gap. Try different textures and colours to build acceptance.',
    'Variety exposure in the first year shapes long-term food preferences. Even if she rejects a food, offer it again in a week — it can take 10-15 exposures.',
    'Ziva has been eating the same foods for a while now. Dietary variety is important for micronutrient balance. Try foods from groups she hasn\'t explored: leafy greens, different lentils, or new fruits.',
  ],
  'food-correlation': [
    'This food has been linked to unusual poop a few times. It may just be coincidence — keep feeding it and see if the pattern holds. Note the consistency each time.',
    'The pattern is becoming consistent. Try pausing this food for a week, then reintroduce in a small quantity. If the poop changes again, it may be a sensitivity.',
    'Multiple occurrences of digestive upset after this food. Discuss with your paediatrician — they may recommend an elimination diet or further testing.',
  ],
  'food-group-gap': [
    'Try adding one food from this group to a meal this week. Variety builds both nutrition and acceptance.',
    'This food group has been missing for a while. Each group provides different micronutrients that are hard to replace. Even small amounts count.',
    'Extended gaps in this food group may lead to nutrient deficiencies. If Ziva consistently refuses foods from this group, discuss alternatives with your paediatrician.',
  ],
  'vacc-reminder': [
    'Check with your paediatrician about any preparation needed. Some vaccines may cause mild fever — keep paracetamol drops handy.',
  ],
  'supp-streak-broken': [
    'Missed a day — just continue normally tomorrow. Don\'t double up the dose.',
    'Supplements work best with consistency. Try linking it to a daily routine — right after the morning feed works well.',
    'Frequent missed doses this month. Vitamin D is critical for bone development at this age. Consider setting a daily alarm or keeping drops next to the feeding chair.',
  ],
  'low-iron': [
    'Best iron sources for babies: ragi porridge, masoor dal khichdi, beetroot purée, spinach dal. Always pair with Vitamin C (lemon, amla, tomato) to boost absorption.',
    'Iron stores from birth deplete around 6 months. At this age, dietary iron becomes critical. Try adding iron-rich foods to at least one meal daily — ragi at breakfast is an easy win.',
    'Persistently low iron intake can lead to anaemia, which affects energy and brain development. If Ziva seems unusually tired or pale, discuss iron levels with your paediatrician.',
  ],
  'low-calcium': [
    'Top calcium sources: ragi (best plant source), paneer, curd/yoghurt, sesame seeds (til), almond paste. Breastmilk still provides some, but solids should contribute too.',
    'Calcium and Vitamin D work together for bone health. Since Ziva takes D3 drops, pairing with calcium-rich foods maximises the benefit. Try ragi porridge or paneer in one meal daily.',
    'Calcium gaps keep recurring. Growing bones need consistent calcium. If dairy is limited, ragi and sesame are excellent alternatives. Discuss calcium intake at the next paediatrician visit.',
  ],
  'low-protein': [
    'Easy protein additions: moong/masoor/toor dal in khichdi, paneer cubes, thick curd, almond paste in porridge, sattu drink. Aim for protein in at least one meal daily.',
    'Protein is essential for muscle growth, immune function, and brain development. Dal-based khichdi is the easiest way to add protein — try different dals for variety.',
    'Protein has been consistently low. At this age, rapid growth demands adequate protein. Consider adding paneer, dal, or nut pastes to every lunch and dinner.',
  ],
  'iron-no-vitc': [
    'Add a squeeze of lemon on dal/khichdi, serve amla after meals, or pair iron meals with orange segments, tomato, or mango. Even a small amount of Vitamin C makes a big difference.',
    'Non-heme iron (from plant foods) has low absorption on its own — only 2-5%. Adding Vitamin C can boost this to 10-20%. A simple lemon squeeze transforms iron absorption.',
    'You\'re consistently providing iron but missing the Vitamin C pairing. Make it a habit: keep a lemon near the kitchen and squeeze a few drops on every dal/ragi meal.',
  ],
  'meal-monotony': [
    'Try swapping one meal — if breakfast is always ragi, try oats or dalia. If lunch is always dal rice, try a vegetable khichdi. Small changes count.',
    'Repeated meals can lead to nutrient gaps and reduce Ziva\'s willingness to try new tastes later. The first year is the best window for building food acceptance.',
    'Same meals for an extended period. Variety in the first year builds the foundation for lifelong eating habits. Even rotating between 3-4 different breakfasts makes a difference.',
  ],
};

