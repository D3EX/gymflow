// frontend/src/pages/member/Program.jsx

import { useEffect, useState, useMemo } from 'react'
import api from '../../api/client'
import { 
  Dumbbell, CheckCircle, Target, ChevronLeft, ChevronRight, Activity, 
  Zap, Loader2, Plus, X, Search, Calendar, Trash2, 
  Save, Users, UserCircle, ChevronDown, Eye, Star, Clock, AlertTriangle, AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

// ============================================================
// CONSTANTS
// ============================================================

const MUSCLE_LABELS = {
  chest: 'Chest', shoulders: 'Shoulders', back: 'Back',
  biceps: 'Biceps', triceps: 'Triceps', core: 'Core',
  legs: 'Legs', glutes: 'Glutes'
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// ============================================================
// MUSCLE MAP DATA - FRONT
// ============================================================

const FRONT_MUSCLES = [
  { id: 'head', d: 'm 11.671635,6.3585449 -0.0482,-2.59085 4.20648,-2.46806 4.42769,2.95361 -0.0405,1.94408 0.24197,-3.34467 -2.03129,-2.31103004 -2.84508,-0.51629 -2.20423,0.52915 -1.9363,2.63077004 z' },
  { id: 'face', d: 'm 19.748825,6.7034949 0.0203,-2.20747 -3.96689,-2.7637 -3.74099,2.23559 -0.006,2.63528 -0.60741,0.0403 0.27408,1.82447 0.97635,0.33932 0.44244,2.1802901 1.82222,2.06556 2.03518,-0.0607 1.79223,-1.94408 0.35957,-2.2406601 0.97616,-0.33932 0.25159,-1.78416 z' },
  { id: 'neck-right', d: 'm 13.304665,11.910505 1.64975,2.35202 0.74426,2.62159 -1.73486,-1.38354 -0.86649,-2.97104 z' },
  { id: 'neck-left', d: 'm 18.385135,11.910505 -1.64975,2.35202 -0.74538,2.62234 1.73486,-1.38354 0.86649,-2.97104 z' },
  { id: 'shoulder-front-left', d: 'm 19.047795,13.248365 3.55748,1.97916 0.72653,-0.35074 z m -0.107,0.43288 -0.37119,1.73073 2.1846,0.53561 1.40116,-0.49436 z' },
  { id: 'shoulder-side-left', d: 'm 22.922305,15.657195 0.75814,-0.41 2.40806,1.66799 1.17364,1.50707 0.62662,1.5626 -0.0464,3.70194 -1.3284,-1.72153 0.0407,-2.59376 -0.48842,-0.50049 c 0,0 -3.09778,-3.19058 -3.14371,-3.21401 z m -0.2409,0.10873 c -0.001,0.0525 3.32987,3.54733 3.32987,3.54733 l 0.10067,3.10396 -1.15426,-1.97782 -2.22547,-0.94804 -1.56576,-2.88481 z' },
  { id: 'shoulder-front-right', d: 'm 12.624785,13.248365 -3.5574599,1.97916 -0.72653,-0.35074 z m 0.107,0.43288 0.37119,1.73073 -2.18459,0.53561 -1.4011499,-0.49436 z' },
  { id: 'shoulder-side-right', d: 'm 8.7502951,15.657195 -0.75814,-0.41 -2.40806,1.66799 -1.17364,1.50707 -0.62662,1.56259 0.0464,3.70195 1.3284,-1.72153 -0.0407,-2.59376 0.48843,-0.5005 c 0,0 3.09777,-3.19057 3.1437,-3.214 z m 0.2409,0.10873 c 0.002,0.0525 -3.32987,3.54733 -3.32987,3.54733 l -0.10067,3.10396 1.15426,-1.97782 2.22547,-0.94804 1.5657499,-2.88481 z' },
  { id: 'biceps-left', d: 'm 27.621665,30.814715 -0.33838,1.70499 -1.81932,-2.54418 -0.6629,-1.26895 z m -2.85271,-2.6096 c -0.0259,-0.0144 -0.0536,-0.0254 -0.0824,-0.0324 l -1.48333,-4.95503 1.00456,-2.08428 1.65511,1.74532 2.23034,6.67667 0.0415,0.93739 c -1.06528,-0.84215 -2.18962,-1.60679 -3.36434,-2.28803 z m 1.6945,-5.75654 1.64893,6.43421 -0.36469,-4.92266 z' },
  { id: 'forearm-left', d: 'm 26.955425,32.969125 1.30083,10.28927 -1.10778,0.01 -1.89387,-7.99609 0.19174,-4.53719 z m 1.21978,-1.94971 -0.58729,2.58635 1.11876,9.15614 0.55849,-0.21663 0.2304,-6.77018 z' },
  { id: 'biceps-right', d: 'm 4.0746451,30.814715 0.33838,1.70499 1.81931,-2.54418 0.66289,-1.26895 z m 2.8527,-2.6096 c 0.0259,-0.0144 0.0536,-0.0254 0.0824,-0.0324 l 1.48332,-4.95503 -1.00455,-2.08428 -1.65509,1.74532 -2.23034,6.67667 -0.0415,0.93739 c 1.06528,-0.84215 2.18961,-1.60679 3.36433,-2.28803 z m -1.6945,-5.75654 -1.64891,6.43421 0.36468,-4.92266 z' },
  { id: 'forearm-right', d: 'm 4.5752651,32.969125 -1.30083,10.28927 1.10778,0.01 1.89387,-7.99609 -0.19174,-4.53719 z m -1.21978,-1.94971 0.58728,2.58635 -1.11875,9.15614 -0.55849,-0.21663 -0.2304,-6.77018 z' },
  { id: 'chest-upper-left', d: 'm 20.337455,17.085495 1.72942,3.09103 1.890,0.94 -0.5,0.3 -6.8, -2.1 z' },
  { id: 'chest-lower-left', d: 'm 16.66,19.72 6.8,2.1 -0.65,0.5 -0.90604,2.63773 -2.09968,0.86537 -3.34524,-1.655 0.2,-3.8 z' },
  { id: 'chest-upper-right', d: 'm 11.351215,17.085495 -1.7294199,3.09103 -1.890,0.94 0.5,0.3 6.8,-2.1 z' },
  { id: 'chest-lower-right', d: 'm 15.03,19.72 -6.8,2.1 0.65,0.5 0.90586,2.63773 2.0996699,0.86537 3.34636,-1.655 -0.2,-3.8 z' },
  { id: 'abs-upper-left', d: 'm 19.641935,34.707615 1.81341,-1.36479 0.15748,1.83347 1.28642,2.37338 -1.98044,2.73652 -1.03109,0.16554 -0.37026,-3.88816 z' },
  { id: 'serratus-anterior-left', d: 'M 19.289,26.152 l -3.11202 -1.40604 0.0937 2.27965 2.80119 1.43603 z M 21.224,27.820 l -1.29355 0.7212 0.14997 -1.70898 z M 20.171,26.183 l 2.47968 -1.03241 -0.9336 2.52093 z M 21.702,27.921 l -1.69005 1.03372 -0.28871 2.0678 1.64975 -1.07533 z' },
  { id: 'obliques-left', d: 'M 18.791,29.025 l -0.0622 1.62387 -2.30308 -0.49961 -0.12448 -2.21722 z M 18.635,31.429 l 0.0311 1.99844 -2.20953 0.59391 -0.0311 -3.1227 z M 21.290,30.444 l -1.48383 1.03372 -0.20622 2.10905 1.64862 -1.32355 z' },
  { id: 'abs-upper-right', d: 'm 12.045985,34.707615 -1.81341,-1.36479 -0.15748,1.83347 -1.2856799,2.37432 1.9804499,2.73595 1.03109,0.16554 0.37119,-3.88721 z' },
  { id: 'abs-lower-right', d: 'm 15.636055,44.919735 -0.60647,-5.91209 -0.015,-3.84879 -2.18479,-1.07533 -0.24746,7.03017 z' },
  { id: 'abs-lower-left', d: 'm 16.051865,44.919165 0.60628,-5.91209 0.0154,-3.84915 2.18404,-1.07515 0.24746,7.03017 z' },
  { id: 'serratus-anterior-right', d: 'm 12.399365,26.152365 3.11202,-1.40603 -0.0937,2.27965 -2.80138,1.4364 z m -1.93508,1.6685 1.29355,0.72139 -0.14997,-1.70899 z m 1.05303,-1.637 -2.4793099,-1.03259 0.93361,2.52148 z m -1.5316399,1.73729 1.6900499,1.03372 0.28871,2.06743 -1.64881,-1.07515 z' },
  { id: 'obliques-right', d: 'M 12.897,29.025 l 0.0623 1.62387 2.30327 -0.49961 0.12448 -2.21703 z M 13.053,31.430 l -0.0309 1.99844 2.20973 0.59353 0.0311 -3.1227 z M 10.398,30.445 l 1.48384 1.0339 0.20622 2.10905 -1.64975 -1.32355 z' },
  { id: 'hip-flexor-right', d: 'm 14.404465,45.040075 0.0221,-0.0277 -0.14866,-0.37945 -3.10172,-3.40449 -0.23283,-0.0825 2.05918,5.32009 z m -1.17263,2.01833 1.27705,3.29948 0.42631,-4.04862 -0.25196,-0.64303 z' },
  { id: 'hip-flexor-left', d: 'm 17.284025,45.040455 -0.0221,-0.0281 0.14867,-0.37926 3.10171,-3.40449 0.23246,-0.0825 -2.05843,5.3199 z m 1.17263,2.01795 -1.27706,3.29948 -0.42631,-4.04843 0.25197,-0.64303 z' },
  { id: 'quads-left', d: 'm 23.419015,50.399125 -0.15504,4.75091 -2.40263,6.60949 0.7362,1.90021 2.36401,-8.34435 z m -0.58154,-11.60825 -0.15485,4.00722 1.31793,7.93154 0.61977,-6.40308 z m -0.38731,5.12268 -2.75152,6.07258 -0.62015,4.87425 1.16232,6.85771 2.51886,-6.98144 0.15504,-7.18764 z' },
  { id: 'adductors-left', d: 'm 22.063225,39.369605 v 4.21363 l -2.94574,5.82511 -1.86027,5.78349 0.19365,-4.0072 z m -3.24944,13.42596 -0.0649,0.15467 -1.21294,2.90207 0.78325,7.18803 1.23619,-0.66122 -1.0714,-6.69272 z' },
  { id: 'foot-left', d: 'm 17.255895,87.868445 0.1243,3.45228 0.28983,1.20638 h 0.87136 l 0.24897,-0.83181 0.29058,-0.0416 -0.0624,0.83181 1.09914,-0.33332 0.29058,-0.16629 1.24444,-0.27033 0.0416,-0.97748 -1.20319,-2.03743 -0.82974,-1.0399 -2.03294,-0.83181 z' },
  { id: 'tibialis-anterior-left', d: 'm 18.251375,70.441125 0.29058,0.91486 0.6224,3.8681 0.0829,5.15733 -0.87136,5.03304 0.0412,-6.44714 -0.91242,-2.57848 -0.12561,-2.82837 z m 1.9915,2.32915 -0.20753,7.73637 -1.65949,6.23904 1.80478,-0.853 3.00816,-10.83583 -1.03727,-6.82095 z' },
  { id: 'knee-left', d: 'm 21.404635,64.784375 0.1243,1.12295 -0.87118,1.08171 -0.29058,1.70599 -0.58116,0.24933 -0.49774,-2.57866 -0.33182,-0.91486 0.29058,-0.58247 z m -3.85853,0.0832 0.6224,1.74685 1.3273,2.57867 -0.33182,2.37095 -0.95423,-2.66209 -0.78738,-1.49734 z m 4.97811,-2.37039 -0.95423,5.11609 0.62241,-0.33295 0.49773,1.66381 z' },
  { id: 'quads-right', d: 'm 8.2694651,50.399125 0.15504,4.75053 2.4026299,6.60968 -0.73638,1.90021 -2.3640099,-8.34435 z m 0.58117,-11.60768 0.15503,4.00684 -1.31754,7.93154 -0.61978,-6.40308 z m 0.38769,5.1223 2.7515099,6.07239 0.61997,4.87425 -1.16232,6.85771 -2.5190499,-6.98163 -0.15504,-7.18801 z' },
  { id: 'adductors-right', d: 'm 9.6258251,39.369415 v 4.21363 l 2.9451699,5.8253 1.86028,5.78349 -0.19366,-4.0072 z m 3.2488699,13.42559 0.0647,0.15485 1.21294,2.90207 -0.78307,7.18803 -1.23618,-0.66102 1.0714,-6.69273 z' },
  { id: 'foot-right', d: 'm 14.433335,87.868265 -0.12448,3.45228 -0.29058,1.20637 h -0.87118 l -0.24877,-0.83181 -0.29059,-0.0416 0.0623,0.83181 -1.09934,-0.33333 -0.29058,-0.16629 -1.2448,-0.27033 -0.0412,-0.97747 1.2031899,-2.03781 0.82975,-1.04009 2.03294,-0.83181 z' },
  { id: 'tibialis-anterior-right', d: 'm 13.437675,70.440945 -0.29058,0.91486 -0.62241,3.86828 -0.0829,5.15733 0.87174,5.03304 -0.0418,-6.44714 0.91298,-2.57848 0.1243,-2.82837 z m -1.99151,2.32914 0.20735,7.73637 1.65968,6.23904 -1.80497,-0.85299 -3.0079799,-10.83584 1.03728,-6.82095 z' },
  { id: 'knee-right', d: 'm 10.284405,64.784375 -0.12448,1.12295 0.87118,1.08171 0.29058,1.70599 0.58116,0.24933 0.49774,-2.57866 0.33182,-0.91486 -0.29058,-0.58247 z m 3.85854,0.0832 -0.62241,1.74685 -1.32767,2.57867 0.33182,2.37095 0.95423,-2.66209 0.78832,-1.4964 z m -4.9786799,-2.37058 0.9542299,5.11609 -0.6223999,-0.33313 -0.49793,1.6638 z' },
  { id: 'elbow-right', d: 'm 3.2054751,27.370125 0.005,3.09419 -0.57959,1.91184 -0.54539,-2.41185 z' },
  { id: 'hand-right', d: 'm 4.3904451,43.563145 -1.5198,0.0506 -0.76631,-0.67112 -1.21261996,2.15767 -0.86245,3.32873 0.49386,0.22113 0.59814996,-2.20238 0.50016,0.25356 -0.35639,2.49422 0.62382,0.24345 0.41402,-2.49194 0.55839,0.17851 -0.2262,2.76603 0.76938,0.32268 0.25788,-2.86764 0.4578,-0.0181 0.16611,2.65239 0.65997,0.2633 0.0712,-4.56643 0.34158,-0.19428 1.35316,1.68367 0.32832,-0.34354 -0.72644,-2.0551 z' },
  { id: 'elbow-left', d: 'm 28.325215,27.370125 -0.005,3.09419 0.57959,1.91184 0.54538,-2.41185 z' },
  { id: 'hand-left', d: 'm 27.140245,43.563145 1.5198,0.0506 0.76631,-0.67111 1.21262,2.15766 0.86245,3.32873 -0.49386,0.22113 -0.59815,-2.20238 -0.50016,0.25356 0.35639,2.49422 -0.62382,0.24345 -0.41402,-2.49194 -0.55839,0.17851 0.2262,2.76603 -0.76938,0.32268 -0.25788,-2.86764 -0.4578,-0.0181 -0.16611,2.6524 -0.65997,0.26329 -0.0712,-4.56643 -0.34158,-0.19428 -1.35316,1.68368 -0.32832,-0.34355 0.72644,-2.0551 z' },
]

// ============================================================
// MUSCLE MAP DATA - BACK
// ============================================================

const BACK_MUSCLES = [
  { id: 'head-back', d: 'm 48.157455,6.3585449 0.44208,-0.14964 0.16111,0.16427 1.48163,4.0475101 2.32401,1.45118 2.39971,-1.52387 0.97577,-3.6896901 0.52752,-0.55908 0.23367,0.0981 0.24198,-3.34467 -2.03129,-2.31103004 -2.84509,-0.51629 -2.20422,0.52915 -1.93631,2.63077004 z' },
  { id: 'nape', d: 'm 52.369695,12.105075 -2.35767,-1.55045 -1.47119,-3.9514301 -0.60741,0.0403 0.27409,1.82447 0.97635,0.33932 0.7613,2.2157201 0.33017,1.06849 0.0895,2.14894 1.16448,0.008 0.10563,-0.70833 0.54716,-0.0606 z m 1.01793,1.47595 0.23768,0.64982 1.38107,-0.004 0.01,-2.38784 0.25971,-0.79061 0.57215,-2.1698001 0.76359,-0.41018 0.25158,-1.78416 -0.62859,0.0193 -1.08488,3.8998101 -2.39725,1.46684 0.2768,1.48507 z' },
  { id: 'traps-upper-left', d: 'M 49.625,14.629 L 49.688,12.005 L 48.974,13.157 L 44.594,14.654 L 45.945,16.925 L 51.222,16.925 L 51.183,14.550 Z' },
  { id: 'traps-mid-left', d: 'M 46.034,17.075 L 48.920,21.925 L 51.303,21.925 L 51.224,17.075 Z' },
  { id: 'traps-lower-left', d: 'M 49.009,22.075 L 49.572,23.022 L 51.403,28.104 L 51.305,22.075 Z' },
  { id: 'traps-upper-right', d: 'M 55.439,14.729 L 55.376,12.104 L 56.090,13.256 L 60.470,14.754 L 59.179,16.925 L 53.844,16.925 L 53.881,14.649 Z' },
  { id: 'traps-mid-right', d: 'M 59.089,17.075 L 56.204,21.925 L 53.763,21.925 L 53.842,17.075 Z' },
  { id: 'traps-lower-right', d: 'M 56.114,22.075 L 55.492,23.121 L 53.661,28.203 L 53.761,22.075 Z' },
  { id: 'lats-upper-left', d: 'M 44.144,15.285 L 39.888,20.286 L 39.426,22.749 L 41.263,21.510 L 44.025,20.355 L 45.663,23.400 L 49.103,23.400 Z' },
  { id: 'deltoid-rear-left', d: 'M 42.201,16.586 L 40.626,18.152 L 39.736,20.156 L 43.992,15.155 Z' },
  { id: 'lats-mid-left', d: 'M 45.771,23.600 L 45.872,23.789 L 47.009,29.286 L 47.023,30.400 L 51.080,30.400 L 51.053,28.314 L 49.185,23.600 Z' },
  { id: 'lats-lower-left', d: 'M 47.026,30.600 L 47.086,35.145 L 51.156,36.255 L 51.082,30.600 Z' },
  { id: 'deltoid-rear-right', d: 'M 62.863,16.686 L 64.438,18.251 L 65.328,20.255 L 61.073,15.254 Z' },
  { id: 'lats-upper-right', d: 'M 60.921,15.384 L 65.176,20.385 L 65.290,22.849 L 63.801,21.609 L 61.039,20.454 L 59.455,23.400 L 56.022,23.400 Z' },
  { id: 'lats-mid-right', d: 'M 59.347,23.600 L 59.192,23.888 L 58.055,29.385 L 58.042,30.400 L 53.986,30.400 L 54.012,28.413 L 55.918,23.600 Z' },
  { id: 'lats-lower-right', d: 'M 58.039,30.600 L 57.979,35.245 L 53.908,36.354 L 53.983,30.600 Z' },
  { id: 'triceps-long-left', d: 'M 43.593,21.039 L 44.920,23.967 L 43.615,25.653 L 43.186,27.069 L 39.209,29.802 Z' },
  { id: 'triceps-lateral-left', d: 'M 43.459,20.972 L 39.075,29.735 L 38.871,25.461 L 39.407,23.674 L 41.242,21.927 Z' },
  { id: 'hand-back-left', d: 'M 40.716955,42.424835 l -1.5182,0.0863 -0.78184,-0.65295 -1.16168,2.1855 -0.78414,3.34805 0.49892,0.20949 0.54632,-2.2158 0.50597,0.24175 -0.29779,2.5019 0.62936,0.22875 0.35546,-2.50096 0.56242,0.16536 -0.16126,2.77057 0.77674,0.30455 0.19056,-2.87291 0.45724,-0.0289 0.22827,2.64778 0.66597,0.24774 -0.0359,-4.56685 0.33693,-0.20224 1.39227,1.65147 0.32017,-0.35115 -0.77444,-2.03749 z' },
  { id: 'forearm-flexors-left', d: 'M 40.775,29.006 L 42.870,27.644 L 42.187,29.635 L 42.603,34.383 L 40.799,42.081 L 39.814,42.253 Z' },
  { id: 'forearm-extensors-left', d: 'M 39.665,42.242 L 38.305,41.501 L 37.998,34.491 L 38.635,31.429 L 39.245,30.209 L 40.625,28.994 Z' },
  { id: 'triceps-long-right', d: 'M 61.376,21.213 L 60.056,24.145 L 61.330,26.199 L 61.657,27.251 L 65.780,29.966 Z' },
  { id: 'triceps-lateral-right', d: 'M 61.510,21.146 L 65.914,29.899 L 66.108,25.624 L 65.568,23.839 L 63.729,22.096 Z' },
  { id: 'hand-back-right', d: 'M 64.301385,42.592325 l 1.51839,0.0828 0.78033,-0.65476 1.16673,2.18281 0.79187,3.34623 -0.49843,0.21064 -0.55144,-2.21453 -0.50541,0.24292 0.30356,2.5012 -0.62882,0.23021 -0.36124,-2.50014 -0.56203,0.16666 0.16765,2.77019 -0.77603,0.30634 -0.19719,-2.87245 -0.45732,-0.0278 -0.22215,2.64829 -0.66539,0.24928 0.0254,-4.56692 -0.3374,-0.20146 -1.38845,1.65469 -0.32098,-0.35041 0.76973,-2.03928 z' },
  { id: 'forearm-flexors-right', d: 'M 65.204,42.420 L 63.925,29.007 L 61.764,27.798 L 62.786,29.733 L 62.397,34.555 L 64.219,42.248 Z' },
  { id: 'forearm-extensors-right', d: 'M 64.075,28.993 L 65.353,42.405 L 66.712,41.663 L 67.002,34.653 L 66.358,31.591 L 65.745,30.373 Z' },
  { id: 'spine', d: 'm 51.733705,14.788555 0.53876,25.33066 0.48967,-0.0297 0.65658,-25.3387 -0.28147,-0.84188 -1.25059,-4.9e-4 z' },
  { id: 'lower-back-erectors-left', d: 'M 52.100,37.310 L 49.537,36.465 L 50.244,40.788 L 52.200,42.030 L 52.200,40.270 L 52.150,40.280 Z' },
  { id: 'lower-back-ql-left', d: 'M 49.389,36.490 L 46.240,35.460 L 44.720,39.420 L 50.096,40.812 Z' },
  { id: 'lower-back-erectors-right', d: 'M 52.800,42.030 L 52.800,40.270 L 52.850,40.260 L 52.900,37.290 L 55.289,36.625 L 54.805,40.801 Z' },
  { id: 'lower-back-ql-right', d: 'M 55.439,36.643 L 55.980,36.470 L 58.320,35.720 L 59.660,39.450 L 54.955,40.819 Z' },
  { id: 'gluteus-medius-left', d: 'M 50.191,41.481 L 44.740,39.690 L 43.830,41.580 L 43.431,44.301 Z' },
  { id: 'gluteus-maximus-left', d: 'M 50.249,41.619 L 43.489,44.439 L 44.410,50.520 L 47.180,51.030 L 51.620,49.090 L 52.200,49.480 L 52.200,42.880 Z' },
  { id: 'gluteus-medius-right', d: 'M 55.274,41.079 L 61.354,45.519 L 60.640,42.150 L 59.740,39.860 Z' },
  { id: 'gluteus-maximus-right', d: 'M 55.186,41.201 L 52.800,42.880 L 52.800,49.480 L 53.570,49.090 L 57.680,50.760 L 60.500,50.600 L 61.266,45.641 Z' },
  { id: 'knee-back-left', d: 'm 51.176145,64.073985 -1.20605,3.01461 0.70738,0.26558 0.89754,3.51771 -0.55801,-4.01191 z m -5.08496,-3.15003 0.63355,1.8609 0.16813,2.03261 0.61314,1.93117 -0.90585,-0.0851 -0.28534,2.15982 z' },
  { id: 'knee-back-right', d: 'm 54.019305,64.073985 1.20605,3.01461 -0.70737,0.26558 -0.89755,3.51771 0.55802,-4.01191 z m 5.08496,-3.15003 -0.63355,1.8609 -0.16813,2.03261 -0.61313,1.93117 0.90584,-0.0851 0.28534,2.15982 z' },
  { id: 'calves-gastroc-medial-left', d: 'M 50.568,67.512 L 51.669,72.509 L 51.379,75.532 L 51.292,76.825 L 48.983,76.825 Z' },
  { id: 'calves-gastroc-lateral-left', d: 'M 50.218,67.512 L 48.633,76.825 L 46.283,76.825 L 45.533,74.263 L 46.783,67.088 Z' },
  { id: 'calves-soleus-left', d: 'M 46.386,77.175 L 51.269,77.175 L 50.701,85.598 L 49.037,86.233 Z' },
  { id: 'calves-gastroc-medial-right', d: 'M 54.628,67.512 L 53.526,72.509 L 53.816,75.532 L 53.903,76.825 L 56.213,76.825 Z' },
  { id: 'calves-gastroc-lateral-right', d: 'M 54.978,67.512 L 56.563,76.825 L 58.912,76.825 L 59.662,74.263 L 58.412,67.088 Z' },
  { id: 'calves-soleus-right', d: 'M 53.927,77.175 L 58.810,77.175 L 56.158,86.233 L 54.495,85.598 Z' },
  { id: 'foot-back-left', d: 'M 50.933115,88.340995 l 0.85194,1.3581 0.37189,0.79238 -0.15588,1.21774 -0.76984,0.74446 -1.51185,0.12543 -1.1299,-0.29192 -0.24225,-0.95894 0.80765,-1.30405 -0.22562,-0.85987 0.29679,-0.84153 -0.0194,-1.81524 1.53568,-0.54817 z m -1.19598,0.4675 0.15943,1.25776 -0.6023,0.97431 m -0.54436,0.29544 1.06474,0.40084 1.55326,-0.65137 z' },
  { id: 'foot-back-right', d: 'M 54.262335,88.340995 l -0.85194,1.3581 -0.37189,0.79238 0.15589,1.21774 0.76983,0.74446 1.51186,0.12543 1.12989,-0.29192 0.24225,-0.95894 -0.80765,-1.30405 0.22563,-0.85987 -0.29679,-0.84153 0.0194,-1.81524 -1.53568,-0.54817 z m 1.19598,0.4675 -0.15943,1.25776 0.6023,0.97431 m 0.54436,0.29544 -1.06474,0.40084 -1.55326,-0.65137 z' },
  { id: 'hamstrings-medial-left', d: 'M 49.550,50.504 L 51.751,49.461 L 52.389,49.692 L 52.424,51.499 L 52.499,56.145 L 50.521,62.188 L 50.997,63.602 L 49.569,66.897 L 48.755,66.754 Z' },
  { id: 'hamstrings-lateral-left', d: 'M 49.400,50.496 L 48.605,66.746 L 47.803,66.596 L 47.302,64.480 L 47.133,62.723 L 44.712,54.565 L 44.369,50.918 L 47.200,51.500 Z' },
  { id: 'hamstrings-medial-right', d: 'M 57.425,51.196 L 56.565,66.806 L 55.759,66.965 L 54.331,63.670 L 54.807,62.256 L 52.829,56.213 L 52.904,51.567 L 52.956,49.769 L 53.520,49.498 Z' },
  { id: 'hamstrings-lateral-right', d: 'M 57.575,51.204 L 60.625,50.950 L 60.616,54.633 L 58.195,62.791 L 58.026,64.547 L 57.525,66.663 L 56.715,66.814 Z' },
]

// ============================================================
// MUSCLE GROUP MAPPING
// ============================================================

const GROUP_TO_MUSCLES = {
  chest: { front: ['chest-upper-left', 'chest-upper-right', 'chest-lower-left', 'chest-lower-right'], back: [] },
  shoulders: {
    front: ['shoulder-front-left', 'shoulder-front-right', 'shoulder-side-left', 'shoulder-side-right'],
    back: ['deltoid-rear-left', 'deltoid-rear-right', 'traps-upper-left', 'traps-upper-right'],
  },
  back: {
    front: [],
    back: [
      'lats-upper-left', 'lats-mid-left', 'lats-lower-left',
      'lats-upper-right', 'lats-mid-right', 'lats-lower-right',
      'traps-mid-left', 'traps-lower-left', 'traps-mid-right', 'traps-lower-right',
      'lower-back-erectors-left', 'lower-back-ql-left', 'lower-back-erectors-right', 'lower-back-ql-right',
      'spine',
    ],
  },
  biceps: { front: ['biceps-left', 'biceps-right'], back: [] },
  triceps: { front: [], back: ['triceps-long-left', 'triceps-lateral-left', 'triceps-long-right', 'triceps-lateral-right'] },
  core: {
    front: [
      'abs-upper-left', 'abs-upper-right', 'abs-lower-left', 'abs-lower-right',
      'obliques-left', 'obliques-right', 'serratus-anterior-left', 'serratus-anterior-right',
    ],
    back: [],
  },
  legs: {
    front: ['quads-left', 'quads-right', 'adductors-left', 'adductors-right', 'tibialis-anterior-left', 'tibialis-anterior-right'],
    back: [
      'hamstrings-medial-left', 'hamstrings-lateral-left', 'hamstrings-medial-right', 'hamstrings-lateral-right',
      'calves-gastroc-medial-left', 'calves-gastroc-lateral-left', 'calves-soleus-left',
      'calves-gastroc-medial-right', 'calves-gastroc-lateral-right', 'calves-soleus-right',
    ],
  },
  glutes: { front: ['hip-flexor-left', 'hip-flexor-right'], back: ['gluteus-medius-left', 'gluteus-maximus-left', 'gluteus-medius-right', 'gluteus-maximus-right'] },
}

const MUSCLE_ID_TO_GROUP = {}
Object.entries(GROUP_TO_MUSCLES).forEach(([group, { front, back }]) => {
  ;[...front, ...back].forEach((id) => { MUSCLE_ID_TO_GROUP[id] = group })
})

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function computeGroupStats(exercises) {
  const stats = {}
  exercises.forEach((ex, i) => {
    ex.targets?.forEach((g) => {
      if (!stats[g]) stats[g] = { total: 0, done: 0, exIdx: [] }
      stats[g].total += 1
      if (ex.done) stats[g].done += 1
      stats[g].exIdx.push(i)
    })
  })
  return { stats }
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Format exercise details for display
function formatExerciseDetails(ex) {
  const parts = []
  if (ex.sets) parts.push(`${ex.sets} sets`)
  if (ex.reps) parts.push(`${ex.reps} reps`)
  if (ex.weight) parts.push(`${ex.weight} kg`)
  if (ex.duration) parts.push(`${ex.duration} min`)
  return parts.join(' · ')
}

// ============================================================
// COMPONENTS
// ============================================================

function Silhouette({ muscles, activeIds, viewBox, label, hoveredGroup, onClickGroup, onHoverGroup, width, height }) {
  const BASE = 'color-mix(in srgb, var(--text-3) 35%, transparent)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <svg
        viewBox={viewBox}
        width={width}
        height={height}
        style={{ display: 'block', overflow: 'visible', filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.35))' }}
      >
        {muscles.map((m) => (
          <path key={`bg-${m.id}`} d={m.d} fill={BASE} stroke="var(--border-md)" strokeWidth="0.5" />
        ))}

        {muscles
          .filter((m) => activeIds.has(m.id))
          .map((m) => {
            const group = MUSCLE_ID_TO_GROUP[m.id]
            const isHovered = hoveredGroup === group

            return (
              <path
                key={`hit-${m.id}`}
                d={m.d}
                fill="var(--accent)"
                opacity={isHovered ? 1 : 0.7}
                stroke={isHovered ? 'var(--text)' : 'none'}
                strokeWidth={isHovered ? '1' : '0'}
                style={{ cursor: 'pointer', transition: 'opacity 0.2s ease' }}
                onMouseEnter={() => onHoverGroup(group)}
                onMouseLeave={() => onHoverGroup(null)}
                onClick={() => onClickGroup(group)}
              />
            )
          })}
      </svg>
      <span style={{ fontSize: '9.5px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </span>
    </div>
  )
}

function BodyMap({ exercises, hoveredGroup, onHoverGroup, onClickGroup }) {
  const { stats } = useMemo(() => computeGroupStats(exercises), [exercises])
  const groups = Object.keys(stats)

  const front = useMemo(() => {
    const s = new Set()
    groups.forEach((g) => GROUP_TO_MUSCLES[g]?.front.forEach((id) => s.add(id)))
    return s
  }, [exercises])

  const back = useMemo(() => {
    const s = new Set()
    groups.forEach((g) => GROUP_TO_MUSCLES[g]?.back.forEach((id) => s.add(id)))
    return s
  }, [exercises])

  return (
    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', alignItems: 'center', padding: '8px 0' }}>
      <Silhouette
        muscles={FRONT_MUSCLES}
        activeIds={front}
        viewBox="0 0 35 93"
        label="Front"
        hoveredGroup={hoveredGroup}
        onHoverGroup={onHoverGroup}
        onClickGroup={onClickGroup}
        width={120}
        height={318}
      />
      <Silhouette
        muscles={BACK_MUSCLES}
        activeIds={back}
        viewBox="37 0 35 93"
        label="Back"
        hoveredGroup={hoveredGroup}
        onHoverGroup={onHoverGroup}
        onClickGroup={onClickGroup}
        width={120}
        height={318}
      />
    </div>
  )
}

// ============================================================
// MAIN COMPONENT - SIMPLIFIED (No Program Selector)
// ============================================================

export default function MemberProgram() {
  const [program, setProgram] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentWeek, setCurrentWeek] = useState(0)
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [hoveredGroup, setHoveredGroup] = useState(null)
  const [pinnedGroup, setPinnedGroup] = useState(null)
  const [updating, setUpdating] = useState(false)
  const [hasProgram, setHasProgram] = useState(false)
  const [hasCoach, setHasCoach] = useState(false)
  const [hasCoachButNoProgram, setHasCoachButNoProgram] = useState(false)
  const [isCoachProgram, setIsCoachProgram] = useState(false)

  // Find a Coach modal — mirrors the same state/endpoints as PersonalSessions.jsx
  const [showFindCoach, setShowFindCoach] = useState(false)
  const [coaches, setCoaches] = useState([])
  const [searchCoach, setSearchCoach] = useState('')
  const [assignedCoach, setAssignedCoach] = useState(null)
  const [coachStatus, setCoachStatus] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [confirmData, setConfirmData] = useState(null)
  
  const [showWeekBuilder, setShowWeekBuilder] = useState(false)
  const [newWeekFocus, setNewWeekFocus] = useState('')

  // Exercise library
  const [exerciseLibrary, setExerciseLibrary] = useState([])
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedMuscle, setSelectedMuscle] = useState('all')
  const [categories, setCategories] = useState([])
  const [muscleGroups, setMuscleGroups] = useState([])
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)
  const [showCustomExercise, setShowCustomExercise] = useState(false)
  const [customExercise, setCustomExercise] = useState({
    name: '',
    sets: '',
    reps: '',
    weight: '',
    targets: [],
  })

  useEffect(() => {
    fetchProgram()
    fetchExerciseLibrary()
  }, [])

  // ✅ Poll for program updates
  useEffect(() => {
    let intervalId

    if (hasProgram) {
      intervalId = setInterval(() => {
        api.get('/programs/my')
          .then(res => {
            if (!res.data || !res.data.id) return
            const changed = JSON.stringify(res.data) !== JSON.stringify(program)
            if (changed) {
              toast.info('Your program has been updated!')
              setProgram(res.data)
              setIsCoachProgram(!!(res.data.coach_name && res.data.coach_name !== ''))
            }
          })
          .catch(err => console.error('Poll error:', err))
      }, 30000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [hasProgram, program])

  // Coach lookup / assignment — same endpoints as PersonalSessions.jsx so
  // both pages stay in sync with the backend's coach-request workflow.
  const fetchMyCoach = async () => {
    try {
      const coachRes = await api.get('/coach/my-coach')
      const status = coachRes.data.status
      setCoachStatus(status)
      if (coachRes.data.coach) {
        setAssignedCoach(coachRes.data.coach)
      } else {
        setAssignedCoach(null)
      }
    } catch (error) {
      console.error('Error fetching coach info:', error)
      setCoachStatus(null)
      setAssignedCoach(null)
    }
  }

  const fetchAvailableCoaches = async () => {
    try {
      const res = await api.get('/coach/available')
      setCoaches(res.data || [])
    } catch (error) {
      console.error('Error fetching coaches:', error)
      setCoaches([])
    }
  }

  const openFindCoach = async () => {
    setShowFindCoach(true)
    await Promise.all([fetchMyCoach(), fetchAvailableCoaches()])
  }

  const showConfirm = (action, data) => {
    setConfirmAction(action)
    setConfirmData(data)
    setShowConfirmModal(true)
  }

  const handleConfirm = async () => {
    setShowConfirmModal(false)
    if (confirmAction === 'assignCoach') {
      await handleAssignCoach(confirmData)
    } else if (confirmAction === 'removeCoach') {
      await handleRemoveCoach()
    }
    setConfirmAction(null)
    setConfirmData(null)
  }

  const handleAssignCoach = async (coachId) => {
    setSubmitting(true)
    try {
      const response = await api.post(`/coach/assign-self/${coachId}`)
      const data = response.data

      if (data.status === 'pending') {
        toast.success(data.message || 'Request sent to coach! Waiting for approval.')
        setCoachStatus('pending')

        const coach = coaches.find(c => c.id === coachId)
        if (coach) setAssignedCoach(coach)

        setShowFindCoach(false)
        await fetchAvailableCoaches()
      } else if (data.status === 'approved') {
        toast.success(data.message || 'Coach assigned successfully!')
        setCoachStatus('approved')

        const coach = coaches.find(c => c.id === coachId)
        if (coach) setAssignedCoach(coach)

        setShowFindCoach(false)
        await fetchProgram()
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to assign coach'
      if (errorMessage.includes('pending request')) {
        toast.info('You already have a pending request with this coach. Waiting for approval.')
        setCoachStatus('pending')

        const coach = coaches.find(c => c.id === coachId)
        if (coach) setAssignedCoach(coach)

        setShowFindCoach(false)
        await fetchAvailableCoaches()
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemoveCoach = async () => {
    setSubmitting(true)
    try {
      await api.delete('/coach/unassign-self')
      toast.success('Coach removed successfully')
      setAssignedCoach(null)
      setCoachStatus(null)
      setShowConfirmModal(false)
      await fetchProgram()
    } catch (error) {
      console.error('Error removing coach:', error)
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to remove coach'
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredCoaches = coaches.filter(coach =>
    coach.name.toLowerCase().includes(searchCoach.toLowerCase()) ||
    coach.specialty?.toLowerCase().includes(searchCoach.toLowerCase()) ||
    coach.bio?.toLowerCase().includes(searchCoach.toLowerCase())
  )

  const fetchProgram = async () => {
    setLoading(true)
    try {
      const coachRes = await api.get('/programs/has-coach')
      const { has_coach, has_coach_program } = coachRes.data
      setHasCoach(has_coach)

      // Member has no coach at all — show no-program screen (with "Find a Coach" button)
      if (!has_coach) {
        setHasProgram(false)
        setHasCoachButNoProgram(false)
        setProgram(null)
        setIsCoachProgram(false)
        setLoading(false)
        return
      }

      // Member has a coach but the coach hasn't assigned a program yet
      if (!has_coach_program) {
        setHasProgram(false)
        setHasCoachButNoProgram(true)
        setProgram(null)
        setIsCoachProgram(false)
        setLoading(false)
        return
      }

      // Coach has assigned a program — fetch it
      const res = await api.get('/programs/my')
      if (res.data && res.data.id) {
        setProgram(res.data)
        setHasProgram(true)
        setHasCoachButNoProgram(false)
        const isCoach = res.data.coach_name && res.data.coach_name !== ''
        setIsCoachProgram(isCoach)
        if (res.data.weeks && res.data.weeks.length > 0) {
          setSelectedDayIndex(0)
        }
      } else {
        setHasProgram(false)
        setHasCoachButNoProgram(true)
        setIsCoachProgram(false)
      }
    } catch (error) {
      console.error('Failed to fetch program:', error)
      setHasProgram(false)
      setHasCoachButNoProgram(false)
      setIsCoachProgram(false)
    } finally {
      setLoading(false)
    }
  }

  const fetchExerciseLibrary = async () => {
    setLibraryLoading(true)
    try {
      const res = await api.get('/programs/exercises/library')
      setExerciseLibrary(res.data || [])
      
      const cats = [...new Set((res.data || []).map(ex => ex.category).filter(Boolean))]
      setCategories(['all', ...cats])
      
      const muscles = [...new Set((res.data || []).flatMap(ex => ex.muscle_groups || []).filter(Boolean))]
      setMuscleGroups(['all', ...muscles])
    } catch (error) {
      console.error('Failed to fetch exercise library:', error)
    } finally {
      setLibraryLoading(false)
    }
  }

  const handleAddWeek = async () => {
    if (isCoachProgram) {
      toast.error('This is a coach program - you cannot modify it')
      return
    }
    
    if (!program) return
    
    const weekNumber = (program.weeks?.length || 0) + 1
    try {
      await api.post('/programs/weeks', {
        program_id: program.id,
        week_number: weekNumber,
        focus: newWeekFocus || `Week ${weekNumber}`
      })
      
      toast.success(`Week ${weekNumber} added!`)
      setShowWeekBuilder(false)
      setNewWeekFocus('')
      fetchProgram()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add week')
    }
  }

  const handleAddDay = async (weekId, dayOfWeek) => {
    if (isCoachProgram) {
      toast.error('This is a coach program - you cannot modify it')
      return
    }
    
    try {
      await api.post('/programs/days', {
        week_id: weekId,
        day_of_week: dayOfWeek,
        is_rest_day: false
      })
      
      toast.success(`${dayOfWeek} added!`)
      fetchProgram()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add day')
    }
  }

  const toggleExercise = async (weekIdx, dayIdx, exIdx) => {
    if (!program || updating) return
    
    setUpdating(true)
    try {
      const exercise = program.weeks[weekIdx].days[dayIdx].exercises[exIdx]
      await api.put(`/programs/exercises/${exercise.id}/toggle`)
      
      const next = JSON.parse(JSON.stringify(program))
      next.weeks[weekIdx].days[dayIdx].exercises[exIdx].done = !exercise.done
      setProgram(next)
      
      toast.success(exercise.done ? 'Exercise unchecked' : 'Exercise completed!')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update exercise')
    } finally {
      setUpdating(false)
    }
  }

  const addExerciseToDay = async (exercise) => {
    if (isCoachProgram) {
      toast.error('This is a coach program - you cannot add exercises')
      return
    }
    
    if (!selectedDay) {
      toast.error('Please select a day first')
      return
    }
    
    try {
      await api.post('/programs/exercises', {
        day_id: selectedDay.id,
        name: exercise.name,
        sets: exercise.default_sets || '4×10',
        reps: exercise.default_reps || '10',
        targets: exercise.muscle_groups || [],
        is_custom: false,
      })
      
      toast.success(`Added ${exercise.name} to ${selectedDay.day_of_week}`)
      setShowAddExercise(false)
      fetchProgram()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add exercise')
    }
  }

  const addCustomExercise = async () => {
    if (isCoachProgram) {
      toast.error('This is a coach program - you cannot add exercises')
      return
    }
    
    if (!selectedDay) {
      toast.error('Please select a day first')
      return
    }
    
    if (!customExercise.name) {
      toast.error('Please enter an exercise name')
      return
    }
    
    try {
      await api.post('/programs/exercises', {
        day_id: selectedDay.id,
        name: customExercise.name,
        sets: customExercise.sets || '3×10',
        reps: customExercise.reps || '10',
        weight: customExercise.weight || 'BW',
        targets: customExercise.targets || [],
        is_custom: true,
      })
      
      toast.success(`Added custom exercise: ${customExercise.name}`)
      setShowCustomExercise(false)
      setCustomExercise({ name: '', sets: '', reps: '', weight: '', targets: [] })
      fetchProgram()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add custom exercise')
    }
  }

  const deleteExercise = async (exerciseId) => {
    if (isCoachProgram) {
      toast.error('This is a coach program - you cannot delete exercises')
      return
    }
    
    if (!confirm('Delete this exercise?')) return
    
    try {
      await api.delete(`/programs/exercises/${exerciseId}`)
      toast.success('Exercise deleted')
      fetchProgram()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete exercise')
    }
  }

  const toggleRestDay = async (dayId) => {
    if (isCoachProgram) {
      toast.error('This is a coach program - you cannot modify it')
      return
    }
    
    try {
      const res = await api.put(`/programs/days/${dayId}/rest`)
      toast.success(res.data.is_rest_day ? 'Day set as rest day' : 'Rest day removed')
      fetchProgram()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update rest day')
    }
  }

  const filteredExercises = (exerciseLibrary || []).filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || ex.category === selectedCategory
    const matchesMuscle = selectedMuscle === 'all' || (ex.muscle_groups && ex.muscle_groups.includes(selectedMuscle))
    return matchesSearch && matchesCategory && matchesMuscle
  })

  if (loading) {
    return (
      <div style={{
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: "'Inter', -apple-system, sans-serif",
        minHeight: '100vh',
        boxSizing: 'border-box',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
          minHeight: '60vh',
        }}>
          <Loader2 size={32} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span style={{ color: 'var(--text-3)', fontSize: '13px', fontWeight: 600 }}>Loading your program…</span>
        </div>
      </div>
    )
  }

  if (!hasProgram) {
    return (
      <>
      <div style={{
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: "'Inter', -apple-system, sans-serif",
        minHeight: '100vh',
        boxSizing: 'border-box',
      }}>
        <div style={{ marginBottom: '22px' }}>
          <p style={{ fontSize: '11px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: '6px' }}>
            Training
          </p>
          <h1 style={{ fontSize: 'clamp(21px, 5.5vw, 28px)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: 'var(--text)' }}>
            My Program
          </h1>
        </div>

        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: 'clamp(40px, 10vw, 80px) clamp(16px, 5vw, 32px)',
          textAlign: 'center',
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '18px',
            background: 'color-mix(in srgb, var(--text-3) 10%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <Dumbbell size={34} color="var(--text-3)" style={{ opacity: 0.5 }} />
          </div>

          {hasCoachButNoProgram ? (
            <>
              <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-2)', margin: '0 0 10px' }}>
                Waiting for Your Coach
              </p>
              <p style={{ fontSize: '14px', color: 'var(--text-3)', maxWidth: '380px', margin: '0 auto', lineHeight: 1.6 }}>
                Your coach hasn't assigned a training program yet. Reach out to them to get started  it'll appear here automatically once they do.
              </p>
            </>
          ) : (
            <>
              <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-2)', margin: '0 0 10px' }}>
                No Coach Assigned Yet
              </p>
              <p style={{ fontSize: '14px', color: 'var(--text-3)', maxWidth: '380px', margin: '0 auto', lineHeight: 1.6 }}>
                You don't have a coach assigned yet. Find a coach to get a personalized training program.
              </p>
              <button
                onClick={openFindCoach}
                style={{
                  marginTop: '20px',
                  padding: '10px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                Find a Coach
              </button>
            </>
          )}
        </div>
      </div>

      {/* Find a Coach modal */}
      {showFindCoach && (
        <div
          onClick={() => setShowFindCoach(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000, padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '18px', maxWidth: '560px', width: '100%',
              maxHeight: '90vh', display: 'flex', flexDirection: 'column',
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid var(--border)',
              background: 'var(--surface-2)', borderRadius: '18px 18px 0 0',
            }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                Find a Coach
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: '2px 0 0' }}>
                Browse available coaches and choose one
              </p>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ position: 'relative', marginBottom: '14px' }}>
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                <input
                  type="text"
                  placeholder="Search coaches..."
                  value={searchCoach}
                  onChange={(e) => setSearchCoach(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px 10px 40px', borderRadius: '10px',
                    border: '1px solid var(--border)', background: 'var(--surface-2)',
                    color: 'var(--text)', fontSize: '13px', boxSizing: 'border-box',
                  }}
                />
              </div>

              {coaches.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <UserCircle size={32} color="var(--text-3)" style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                  <p style={{ fontSize: '14px', color: 'var(--text-2)' }}>No coaches available</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                  {filteredCoaches.map((coach) => {
                    const coachId = Number(coach.id)
                    const currentCoachId = Number(assignedCoach?.id)
                    const isApproved = coachStatus === 'approved' && currentCoachId === coachId
                    const isPending = coachStatus === 'pending' && currentCoachId === coachId

                    return (
                      <div
                        key={coach.id}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '14px 16px', borderRadius: '10px',
                          background: isApproved ? 'var(--green)0D' : isPending ? 'var(--blue)0D' : 'var(--surface-2)',
                          border: `1px solid ${isApproved ? 'var(--green)33' : isPending ? 'var(--blue)33' : 'var(--border)'}`,
                          flexWrap: 'wrap', gap: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
                          <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '16px', flexShrink: 0,
                            background: isApproved ? 'var(--green)1A' : isPending ? 'var(--blue)1A' : 'var(--accent)1A',
                            color: isApproved ? 'var(--green)' : isPending ? 'var(--blue)' : 'var(--accent)',
                          }}>
                            {coach.name.charAt(0)}
                          </div>
                          <div style={{ flex: 1, minWidth: '120px' }}>
                            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                              {coach.name}
                            </p>
                            <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: 0 }}>
                              {coach.specialty || 'General Fitness'}
                            </p>
                            {coach.rating && (
                              <p style={{ fontSize: '11px', color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}>
                                <Star size={12} fill="var(--amber)" />
                                {coach.rating} • {coach.client_count || 0} clients
                              </p>
                            )}
                          </div>
                        </div>

                        {isApproved ? (
                          <span style={{
                            padding: '4px 12px', borderRadius: '6px', background: 'var(--green)1A',
                            color: 'var(--green)', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap',
                          }}>
                            Your Coach
                          </span>
                        ) : isPending ? (
                          <span style={{
                            padding: '4px 12px', borderRadius: '6px', background: 'var(--blue)1A',
                            color: 'var(--blue)', fontSize: '11px', fontWeight: 700,
                            display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap',
                          }}>
                            <Clock size={12} /> Pending
                          </span>
                        ) : (
                          <button
                            onClick={() => showConfirm('assignCoach', coach.id)}
                            disabled={submitting}
                            style={{
                              padding: '6px 16px', borderRadius: '8px', border: 'none',
                              background: 'var(--accent)', color: '#FFFFFF', fontSize: '12px',
                              fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
                              opacity: submitting ? 0.6 : 1,
                            }}
                          >
                            Assign
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div style={{
              padding: '16px 24px', borderTop: '1px solid var(--border)',
              background: 'var(--surface-2)', display: 'flex', gap: '12px',
              borderRadius: '0 0 18px 18px', flexShrink: 0,
            }}>
              <button
                onClick={() => setShowFindCoach(false)}
                style={{
                  flex: 1, padding: '10px 20px', borderRadius: '10px',
                  border: '1px solid var(--border)', background: 'transparent',
                  color: 'var(--text-2)', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm assign modal */}
      {showConfirmModal && (
        <div
          onClick={() => setShowConfirmModal(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1001, padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '18px', maxWidth: '420px', width: '100%',
              textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', background: 'var(--amber)1A', color: 'var(--amber)',
              }}>
                <AlertCircle size={28} />
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
                Assign Yourself to This Coach?
              </h3>

              <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '20px' }}>
                Are you sure you want to assign yourself to <strong>{coaches.find(c => c.id === confirmData)?.name}</strong>?
                The coach will need to approve your request before you can book sessions.
              </p>

              <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  style={{
                    flex: 1, padding: '10px 20px', borderRadius: '10px',
                    border: '1px solid var(--border)', background: 'transparent',
                    color: 'var(--text-2)', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={submitting}
                  style={{
                    flex: 1, padding: '10px 20px', borderRadius: '10px', border: 'none',
                    background: 'var(--accent)', color: '#FFFFFF', fontSize: '13px',
                    fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.6 : 1,
                  }}
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
    )
  }

  const hasWeeks = program.weeks && program.weeks.length > 0

  if (!hasWeeks) {
    return (
      <div style={{
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: "'Inter', -apple-system, sans-serif",
        minHeight: '100vh',
        boxSizing: 'border-box',
      }}>
        <style>{`
          .btn-primary {
            padding: 10px 20px;
            border-radius: 10px;
            border: none;
            background: var(--accent);
            color: #FFFFFF;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }
          .btn-primary:hover:not(:disabled) {
            opacity: 0.85;
            transform: translateY(-2px);
          }
          .btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .btn-secondary {
            padding: 10px 20px;
            border-radius: 10px;
            border: 1px solid var(--border);
            background: var(--surface-2);
            color: var(--text-2);
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }
          .btn-secondary:hover {
            background: var(--surface-3);
            border-color: var(--text-3);
            color: var(--text);
          }
          .btn-secondary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        `}</style>

        <div style={{ marginBottom: '22px' }}>
          <p style={{ fontSize: '11px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: '6px' }}>
            Training
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: 'clamp(21px, 5.5vw, 28px)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: 'var(--text)' }}>
                  {program.name}
                </h1>
                {isCoachProgram && (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '4px 12px',
                    borderRadius: '99px',
                    background: 'var(--blue)1A',
                    color: 'var(--blue)',
                    border: '1px solid var(--blue)33'
                  }}>
                    <Users size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                    Coach Program
                  </span>
                )}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>
                {program.description || (isCoachProgram ? 'Program assigned by your coach' : 'Build your program by adding weeks')}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {!isCoachProgram && (
                <button
                  onClick={() => setShowWeekBuilder(true)}
                  className="btn-secondary"
                  style={{ padding: '6px 14px', fontSize: '12px' }}
                >
                  <Plus size={12} />
                  Add Week
                </button>
              )}
              {isCoachProgram && (
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: '99px',
                  background: 'color-mix(in srgb, var(--amber) 10%, transparent)',
                  color: 'var(--amber)',
                  border: '1px solid color-mix(in srgb, var(--amber) 20%, transparent)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Eye size={12} />
                  Read Only
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center',
        }}>
          <Calendar size={48} color="var(--text-3)" style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-2)' }}>No Weeks Created Yet</p>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>
            {isCoachProgram 
              ? "Your coach is still building this program. Check back later!"
              : "Start by adding your first week. Each week can have up to 7 days."}
          </p>
          
          {!isCoachProgram && !showWeekBuilder && (
            <button
              onClick={() => setShowWeekBuilder(true)}
              className="btn-primary"
              style={{ marginTop: '16px' }}
            >
              <Plus size={16} />
              Add First Week
            </button>
          )}
        </div>
      </div>
    )
  }

  const weekData = program.weeks[currentWeek]
  
  const hasDays = weekData && weekData.days && weekData.days.length > 0
  const currentDay = hasDays ? (weekData.days[selectedDayIndex] || weekData.days[0]) : null
  
  if (!hasDays) {
    return (
      <div style={{
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: "'Inter', -apple-system, sans-serif",
        padding: '0px',
        minHeight: '100vh',
        boxSizing: 'border-box',
      }}>
        <div style={{ marginBottom: '22px' }}>
          <p style={{ fontSize: '11px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: '6px' }}>
            Training
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: 'clamp(21px, 5.5vw, 28px)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: 'var(--text)' }}>
                  {program.name}
                </h1>
                {isCoachProgram && (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '4px 12px',
                    borderRadius: '99px',
                    background: 'var(--blue)1A',
                    color: 'var(--blue)',
                    border: '1px solid var(--blue)33'
                  }}>
                    <Users size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                    Coach Program
                  </span>
                )}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>
                {program.description || (isCoachProgram ? 'Program assigned by your coach' : 'Add days to your week')}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {!isCoachProgram && availableDays && availableDays.length > 0 && (
                <button
                  onClick={() => {
                    handleAddDay(weekData.id, availableDays[0])
                  }}
                  className="btn-secondary"
                  style={{ padding: '6px 14px', fontSize: '12px', marginLeft: '8px' }}
                >
                  <Plus size={12} />
                  Add Day
                </button>
              )}
              {isCoachProgram && (
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: '99px',
                  background: 'color-mix(in srgb, var(--amber) 10%, transparent)',
                  color: 'var(--amber)',
                  border: '1px solid color-mix(in srgb, var(--amber) 20%, transparent)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Eye size={12} />
                  Read Only
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center',
        }}>
          <Calendar size={48} color="var(--text-3)" style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-2)' }}>No Days Added Yet</p>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>
            {isCoachProgram 
              ? "Your coach is building this week's program. Check back later!"
              : `Add days to Week ${currentWeek + 1} to start adding exercises.`}
          </p>
        </div>
      </div>
    )
  }

  const totalWeeks = program.weeks.length
  const allExercises = program.weeks.flatMap((w) => w.days.flatMap((d) => d.exercises || []))
  const doneCount = allExercises.filter((e) => e.done).length
  const totalCount = allExercises.length
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0
  const activeGroup = hoveredGroup ?? pinnedGroup

  const existingDayNames = new Set(weekData.days.map(d => d.day_of_week))
  const availableDays = DAYS_OF_WEEK.filter(d => !existingDayNames.has(d))

  return (
    <div style={{
      background: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: "'Inter', -apple-system, sans-serif",
      padding: '0px',
      minHeight: '100vh',
      boxSizing: 'border-box',
    }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
        .day-tab { transition: all 0.2s ease; }
        .day-tab:hover { background: color-mix(in srgb, var(--accent) 8%, transparent) !important; }
        .exercise-row { transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .modal-content {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 24px 64px rgba(0,0,0,0.5);
        }
        .form-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text);
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .form-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 13%, transparent);
        }
        .form-input::placeholder {
          color: var(--text-3);
        }
        .form-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-primary {
          padding: 10px 20px;
          border-radius: 10px;
          border: none;
          background: var(--accent);
          color: #FFFFFF;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .btn-primary:hover:not(:disabled) {
          opacity: 0.85;
          transform: translateY(-2px);
        }
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-secondary {
          padding: 10px 20px;
          border-radius: 10px;
          border: 1px solid var(--border-md);
          background: var(--surface-2);
          color: var(--text-2);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .btn-secondary:hover:not(:disabled) {
          background: var(--surface-3);
          border-color: var(--border-hi);
          color: var(--text);
        }
        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          border-radius: 99px;
          font-size: 10px;
          font-weight: 700;
        }
        .badge-rest {
          background: color-mix(in srgb, var(--amber) 10%, transparent);
          color: var(--amber);
          border: 1px solid color-mix(in srgb, var(--amber) 20%, transparent);
        }
        .coach-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 99px;
          background: var(--blue)1A;
          color: var(--blue);
          border: 1px solid var(--blue)33;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .readonly-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 99px;
          background: color-mix(in srgb, var(--amber) 10%, transparent);
          color: var(--amber);
          border: 1px solid color-mix(in srgb, var(--amber) 20%, transparent);
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .exercise-detail-tag {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          background: var(--surface-3);
          color: var(--text-3);
        }
        .placeholder {
          color: var(--text-3);
        }

        /* ============================================================
           RESPONSIVE / MOBILE LAYOUT
           ============================================================ */
        .main-content-flex {
          display: flex;
          min-height: 460px;
        }
        .exercises-panel {
          flex: 1;
          min-width: 0;
          padding: 20px;
          overflow-y: auto;
          max-height: 480px;
        }
        .body-map-panel {
          flex: 0 0 320px;
          padding: 20px;
          border-left: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          align-items: center;
          background: var(--surface-2);
        }
        .custom-exercise-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .day-tabs-row {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .filter-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .filter-select {
          width: 140px;
        }

        @media (max-width: 860px) {
          .main-content-flex {
            flex-direction: column;
            min-height: 0;
          }
          .exercises-panel {
            max-height: none;
            overflow-y: visible;
            padding: 16px;
          }
          .body-map-panel {
            flex-basis: auto;
            width: 100%;
            border-left: none;
            border-top: 1px solid var(--border);
            padding: 16px;
          }
        }

        @media (max-width: 560px) {
          .custom-exercise-grid {
            grid-template-columns: 1fr;
          }
          .day-tabs-row {
            flex-wrap: nowrap;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 4px;
          }
          .day-tabs-row::-webkit-scrollbar { height: 4px; }
          .day-tabs-row button {
            flex-shrink: 0;
          }
          .filter-row {
            flex-direction: column;
          }
          .filter-select {
            width: 100%;
          }
          .modal-content {
            border-radius: 14px;
            max-height: 92vh;
          }
          
          .program-desc-container {
            display: block;
            width: 100%;
            margin-top: 4px;
            font-size: 13px;
            color: var(--text-3);
          }
        }
      `}</style>

      {/* Header - Organized for Mobile (Fixed Read Only badge) */}
      <div style={{ marginBottom: '22px' }}>
        {/* Training Label */}
        <p style={{ fontSize: '11px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: '6px' }}>
          Training
        </p>

        {/* Responsive Header Layout */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', // Stacks everything vertically on mobile
          gap: '8px',
        }}>
          
          {/* ROW 1: Title & Program Status Badges */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            flexWrap: 'wrap' 
          }}>
            <h1 style={{ fontSize: 'clamp(21px, 5.5vw, 28px)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: 'var(--text)' }}>
              {program.name || 'My Program'}
            </h1>
            
            {isCoachProgram && (
              <span className="coach-badge">
                <Users size={12} />
                Coach Program
              </span>
            )}

            {isCoachProgram && (
              <span className="readonly-badge">
                <Eye size={12} />
                Read Only
              </span>
            )}
          </div>

          {/* ROW 2: Program Description (Own dedicated placeholder row) */}
          <div style={{ 
            fontSize: '13px', 
            color: 'var(--text-3)', // Placeholder/Infinity text color
            lineHeight: '1.4', 
            marginTop: '2px',
            wordBreak: 'break-word' // Prevents long strings from breaking layout
          }}>
            {program.description || (isCoachProgram ? 'Program assigned by your coach' : 'Track your workout progress')}
          </div>

          {/* ROW 3: Coach, Dates & Actions (Kept together, aligned neatly) */}
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            alignItems: 'center', 
            gap: '8px',
            marginTop: '4px'
          }}>
            {program.coach_name && isCoachProgram && (
              <span style={{ fontSize: '12px', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <UserCircle size={14} />
                Coach: {program.coach_name}
              </span>
            )}
            
            {program.start_date && program.end_date && (
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '99px', background: 'color-mix(in srgb, var(--green) 10%, transparent)', color: 'var(--green)' }}>
                {formatDate(program.start_date)} — {formatDate(program.end_date)}
              </span>
            )}

            {!isCoachProgram && (
              <button
                onClick={() => setShowWeekBuilder(true)}
                className="btn-secondary"
                style={{ padding: '6px 14px', fontSize: '12px' }}
              >
                <Plus size={12} />
                Add Week
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add Week Modal - Only shown for non-coach programs */}
      {showWeekBuilder && !isCoachProgram && (
        <div className="modal-overlay" onClick={() => setShowWeekBuilder(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text)' }}>Add New Week</h3>
              <button
                onClick={() => setShowWeekBuilder(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-3)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '16px' }}>
                Week {totalWeeks + 1} will be added to your program.
              </p>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
                  Week Focus (Optional)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Strength, Cardio, Recovery"
                  value={newWeekFocus}
                  onChange={(e) => setNewWeekFocus(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button onClick={handleAddWeek} className="btn-primary">
                  <Plus size={16} />
                  Add Week {totalWeeks + 1}
                </button>
                <button onClick={() => setShowWeekBuilder(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '22px',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '18px' }}>
          <div>
            <p style={{ fontSize: '10.5px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: '5px' }}>
              Overall progress
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: 'clamp(24px, 7vw, 32px)', fontWeight: 900, color: 'var(--accent)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {progress}%
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>
                {doneCount} / {totalCount} exercises
              </span>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '180px' }}>
            <div style={{ height: '10px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--accent), var(--green))',
                borderRadius: '99px',
                transition: 'width 0.5s ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Week 1</span>
              <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Week {totalWeeks}</span>
            </div>
          </div>
        </div>
      </div>



{/* Week Navigation and Focus - Combined */}
<div style={{ 
  display: 'flex', 
  gap: '16px', 
  marginBottom: '16px', 
  flexWrap: 'wrap', 
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
  {/* Left side: Week Navigation */}
  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
    <button
      onClick={() => setCurrentWeek(Math.max(0, currentWeek - 1))}
      disabled={currentWeek === 0}
      style={{
        width: '30px', height: '30px', borderRadius: '8px',
        border: '1px solid var(--border-md)',
        background: 'var(--surface-2)',
        color: currentWeek === 0 ? 'var(--text-3)' : 'var(--text-2)',
        cursor: currentWeek === 0 ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: currentWeek === 0 ? 0.5 : 1,
      }}
    >
      <ChevronLeft size={15} />
    </button>
    <span style={{
      padding: '4px 16px',
      background: 'var(--surface-2)',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: 700,
      border: '1px solid var(--border-md)',
      color: 'var(--text)',
    }}>
      Week {currentWeek + 1} / {totalWeeks}
    </span>
    <button
      onClick={() => setCurrentWeek(Math.min(totalWeeks - 1, currentWeek + 1))}
      disabled={currentWeek === totalWeeks - 1}
      style={{
        width: '30px', height: '30px', borderRadius: '8px',
        border: '1px solid var(--border-md)',
        background: 'var(--surface-2)',
        color: currentWeek === totalWeeks - 1 ? 'var(--text-3)' : 'var(--text-2)',
        cursor: currentWeek === totalWeeks - 1 ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: currentWeek === totalWeeks - 1 ? 0.5 : 1,
      }}
    >
      <ChevronRight size={15} />
    </button>
    
    {!isCoachProgram && availableDays && availableDays.length > 0 && (
      <button
        onClick={() => {
          handleAddDay(weekData.id, availableDays[0])
        }}
        className="btn-secondary"
        style={{ padding: '6px 14px', fontSize: '12px', marginLeft: '8px' }}
      >
        <Plus size={12} />
        Add Day
      </button>
    )}
  </div>

  {/* Right side: Week Focus */}
  {weekData.focus && (
    <div style={{
      display: 'flex', 
      alignItems: 'center', 
      gap: '10px',
      padding: '8px 16px',
      borderRadius: '10px',
      background: 'color-mix(in srgb, var(--accent) 5%, transparent)',
      border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
    }}>
      <div style={{
        width: '28px', height: '28px', borderRadius: '8px',
        background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Target size={14} color="var(--accent)" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '10.5px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
          Focus:
        </span>
        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
          {weekData.focus}
        </span>
      </div>
    </div>
  )}
</div>

      {/* Day tabs */}
      <div className="day-tabs-row">
        {weekData.days.map((day, index) => {
          const exercises = day.exercises || []
          const done = exercises.filter((e) => e.done).length
          const total = exercises.length
          const isActive = selectedDayIndex === index
          return (
            <button
              key={index}
              onClick={() => setSelectedDayIndex(index)}
              className="day-tab"
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                background: isActive ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--surface-2)',
                color: isActive ? 'var(--accent)' : 'var(--text-2)',
                fontWeight: isActive ? 700 : 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>{day.day_of_week}</span>
              {day.is_rest_day && (
                <span className="badge badge-rest">Rest</span>
              )}
              {!day.is_rest_day && total > 0 && (
                <span style={{
                  fontSize: '10px', padding: '1px 8px', borderRadius: '99px',
                  background: isActive ? 'color-mix(in srgb, var(--accent) 20%, transparent)' : 'var(--surface-3)',
                  color: isActive ? 'var(--accent)' : 'var(--text-3)',
                  fontWeight: 700,
                }}>
                  {done}/{total}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Main card with exercises and body map */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        overflow: 'hidden',
      }}>
        <div className="main-content-flex">
          {/* Exercises */}
          <div className="exercises-panel">
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '14px', paddingBottom: '12px',
              borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Dumbbell size={16} color="var(--accent)" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                  {currentDay.day_of_week}
                  {currentDay.is_rest_day && ' (Rest Day)'}
                </span>
                {!currentDay.is_rest_day && (
                  <span style={{
                    fontSize: '10px', marginLeft: '4px', padding: '3px 11px', borderRadius: '99px',
                    background: 'color-mix(in srgb, var(--accent) 8%, transparent)', color: 'var(--accent)', fontWeight: 700,
                  }}>
                    {currentDay.exercises?.filter((e) => e.done).length || 0}/{currentDay.exercises?.length || 0} done
                  </span>
                )}
              </div>
              
              {!isCoachProgram && !currentDay.is_rest_day && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => toggleRestDay(currentDay.id)}
                    className="btn-secondary"
                    style={{ padding: '4px 12px', fontSize: '11px' }}
                  >
                    Set Rest
                  </button>
                  <button
                    onClick={() => { setSelectedDay(currentDay); setShowAddExercise(true); }}
                    className="btn-primary"
                    style={{ padding: '4px 12px', fontSize: '11px' }}
                  >
                    <Plus size={12} />
                    Add Exercise
                  </button>
                </div>
              )}
              
              {isCoachProgram && !currentDay.is_rest_day && (
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'var(--text-3)',
                  padding: '4px 12px',
                  borderRadius: '99px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)'
                }}>
                  <Eye size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  View Only
                </span>
              )}
              
              {!isCoachProgram && currentDay.is_rest_day && (
                <button
                  onClick={() => toggleRestDay(currentDay.id)}
                  className="btn-secondary"
                  style={{ padding: '4px 12px', fontSize: '11px' }}
                >
                  Remove Rest
                </button>
              )}
            </div>

            {currentDay.is_rest_day ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)' }}>
                <Activity size={32} style={{ margin: '0 auto 10px', opacity: 0.4, color: 'var(--text-3)' }} />
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-2)' }}>Rest Day</p>
                <p style={{ fontSize: '12px', color: 'var(--text-3)' }}>Take it easy!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {currentDay.exercises?.map((ex, exIdx) => {
                  const related = activeGroup && ex.targets?.includes(activeGroup)
                  
                  // Build exercise details string
                  const details = []
                  if (ex.sets) details.push(ex.sets)
                  if (ex.reps) details.push(ex.reps)
                  if (ex.weight) details.push(`${ex.weight} kg`)
                  if (ex.duration) details.push(`${ex.duration} min`)
                  
                  return (
                    <div
                      key={ex.id}
                      className="exercise-row"
                      onClick={() => toggleExercise(currentWeek, selectedDayIndex, exIdx)}
                      onMouseEnter={() => setHoveredGroup(ex.targets?.[0])}
                      onMouseLeave={() => setHoveredGroup(null)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '11px 14px',
                        borderRadius: '10px',
                        background: ex.done ? 'color-mix(in srgb, var(--green) 5%, transparent)' : related ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'var(--surface-2)',
                        border: `1px solid ${ex.done ? 'color-mix(in srgb, var(--green) 20%, transparent)' : related ? 'color-mix(in srgb, var(--accent) 33%, transparent)' : 'var(--border)'}`,
                        cursor: updating ? 'default' : 'pointer',
                        transform: related ? 'translateX(6px)' : 'translateX(0)',
                        boxShadow: related ? '0 4px 16px color-mix(in srgb, var(--accent) 13%, transparent)' : 'none',
                        opacity: updating ? 0.6 : 1,
                      }}
                    >
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: ex.done ? 'var(--green)' : related ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'var(--surface-3)',
                        color: ex.done ? '#FFFFFF' : related ? 'var(--accent)' : 'var(--text-3)',
                        fontSize: '11px', fontWeight: 700, transition: 'all 0.3s ease',
                      }}>
                        {ex.done ? <CheckCircle size={14} color="#FFFFFF" /> : exIdx + 1}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: '13.5px', fontWeight: 700,
                          color: ex.done ? 'var(--text-3)' : 'var(--text)',
                          textDecoration: ex.done ? 'line-through' : 'none',
                          marginBottom: '5px',
                        }}>
                          {ex.name}
                          {ex.is_custom && (
                            <span style={{
                              fontSize: '9px', marginLeft: '6px', padding: '1px 6px', borderRadius: '4px',
                              background: 'color-mix(in srgb, var(--blue) 10%, transparent)', color: 'var(--blue)',
                            }}>
                              Custom
                            </span>
                          )}
                        </p>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
                          {/* Muscle tags */}
                          {ex.targets?.map((t) => (
                            <span key={t} style={{
                              fontSize: '9.5px', padding: '2px 9px', borderRadius: '99px',
                              background: t === activeGroup ? 'var(--accent)' : 'var(--surface-3)',
                              color: t === activeGroup ? '#FFFFFF' : 'var(--text-3)',
                              fontWeight: 700, textTransform: 'capitalize',
                              transition: 'all 0.25s ease',
                            }}>
                              {MUSCLE_LABELS[t] || t}
                            </span>
                          ))}
                          
                          {/* Exercise details - sets, reps, weight */}
                          {details.length > 0 && details.map((detail, i) => (
                            <span key={i} className="exercise-detail-tag">
                              {detail}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                        {!isCoachProgram && (
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteExercise(ex.id); }}
                            style={{
                              padding: '4px 8px', borderRadius: '6px', border: 'none',
                              background: 'transparent', color: 'var(--text-3)',
                              cursor: 'pointer', transition: 'color 0.2s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--red)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-3)'}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
                {(!currentDay.exercises || currentDay.exercises.length === 0) && (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Activity size={32} color="var(--text-3)" style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                    <p style={{ fontSize: '14px', color: 'var(--text-2)', fontWeight: 600 }}>
                      {isCoachProgram ? 'No exercises for this day yet' : 'No exercises for this day'}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>
                      {isCoachProgram 
                        ? 'Your coach is building this day\'s workout.' 
                        : 'Click "Add Exercise" to get started!'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Body map - always visible */}
          <div className="body-map-panel">
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px',
              paddingBottom: '10px', borderBottom: '1px solid var(--border)',
              width: '100%', justifyContent: 'center',
            }}>
              <Activity size={16} color="var(--accent)" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)' }}>Muscle map</span>
              <Zap size={12} color="var(--accent)" />
            </div>

            <BodyMap
              exercises={currentDay.exercises || []}
              hoveredGroup={activeGroup}
              onHoverGroup={setHoveredGroup}
              onClickGroup={(group) => setPinnedGroup(prev => prev === group ? null : group)}
            />

            {activeGroup ? (
              <div style={{
                marginTop: '12px', padding: '10px 16px', borderRadius: '10px',
                background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 12%, transparent), color-mix(in srgb, var(--accent) 3%, transparent))',
                border: '1px solid color-mix(in srgb, var(--accent) 27%, transparent)',
                width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '10px', flexWrap: 'wrap',
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)' }}>
                  {MUSCLE_LABELS[activeGroup] || activeGroup}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-3)', background: 'var(--surface)', padding: '2px 10px', borderRadius: '99px' }}>
                  {currentDay.exercises?.filter((e) => e.targets?.includes(activeGroup)).length || 0} exercises
                </span>
                <button
                  onClick={() => setPinnedGroup(null)}
                  style={{
                    background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: 'none', borderRadius: '50%',
                    width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--accent)', fontSize: '13px',
                  }}
                >
                  ×
                </button>
              </div>
            ) : (
              <div style={{ marginTop: '12px', padding: '8px 16px', textAlign: 'center', width: '100%', color: 'var(--text-3)', fontSize: '11px' }}>
                Hover or click a muscle to highlight exercises
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Exercise Modal - Only shown for non-coach programs */}
      {showAddExercise && selectedDay && !isCoachProgram && (
        <div className="modal-overlay" onClick={() => setShowAddExercise(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Plus size={18} color="var(--accent)" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                  Add Exercise to {selectedDay.day_of_week}
                </h3>
              </div>
              <button
                onClick={() => setShowAddExercise(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-3)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button
                  onClick={() => setShowCustomExercise(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: `1px solid ${!showCustomExercise ? 'var(--accent)' : 'var(--border)'}`,
                    background: !showCustomExercise ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--surface-2)',
                    color: !showCustomExercise ? 'var(--accent)' : 'var(--text-2)',
                    fontSize: '13px',
                    fontWeight: !showCustomExercise ? 700 : 600,
                    cursor: 'pointer',
                  }}
                >
                  Exercise Library
                </button>
                <button
                  onClick={() => setShowCustomExercise(true)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: `1px solid ${showCustomExercise ? 'var(--accent)' : 'var(--border)'}`,
                    background: showCustomExercise ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--surface-2)',
                    color: showCustomExercise ? 'var(--accent)' : 'var(--text-2)',
                    fontSize: '13px',
                    fontWeight: showCustomExercise ? 700 : 600,
                    cursor: 'pointer',
                  }}
                >
                  Custom Exercise
                </button>
              </div>

              {!showCustomExercise ? (
                <>
                  <div className="filter-row">
                    <div style={{ flex: 1, minWidth: '150px', position: 'relative' }}>
                      <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Search exercises..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '36px' }}
                      />
                    </div>
                    <select
                      className="form-input filter-select"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
                      ))}
                    </select>
                    <select
                      className="form-input filter-select"
                      value={selectedMuscle}
                      onChange={(e) => setSelectedMuscle(e.target.value)}
                    >
                      {muscleGroups.map(muscle => (
                        <option key={muscle} value={muscle}>{muscle === 'all' ? 'All Muscles' : muscle}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {libraryLoading ? (
                      <div style={{ textAlign: 'center', padding: '40px' }}>
                        <Loader2 size={24} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
                      </div>
                    ) : filteredExercises.length > 0 ? (
                      filteredExercises.map(ex => (
                        <div
                          key={ex.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            borderRadius: '10px',
                            background: 'var(--surface-2)',
                            border: '1px solid var(--border)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                          onClick={() => addExerciseToDay(ex)}
                        >
                          <div>
                            <p style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: 'var(--text)' }}>
                              {ex.name}
                            </p>
                            <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                              {ex.category && (
                                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'var(--surface-3)', color: 'var(--text-3)' }}>
                                  {ex.category}
                                </span>
                              )}
                              {ex.muscle_groups?.slice(0, 3).map(m => (
                                <span key={m} style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '4px', background: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' }}>
                                  {MUSCLE_LABELS[m] || m}
                                </span>
                              ))}
                              {ex.default_sets && (
                                <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '4px', background: 'var(--surface-3)', color: 'var(--text-3)' }}>
                                  {ex.default_sets}×{ex.default_reps}
                                </span>
                              )}
                            </div>
                          </div>
                          <button className="btn-primary" style={{ padding: '6px 14px', fontSize: '12px' }}>
                            <Plus size={12} />
                            Add
                          </button>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)' }}>
                        <p>No exercises found</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>
                      Exercise Name *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={customExercise.name}
                      onChange={(e) => setCustomExercise({ ...customExercise, name: e.target.value })}
                      placeholder="e.g., My Special Exercise"
                    />
                  </div>
                  <div className="custom-exercise-grid">
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>
                        Sets
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={customExercise.sets}
                        onChange={(e) => setCustomExercise({ ...customExercise, sets: e.target.value })}
                        placeholder="4×10"
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>
                        Reps
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={customExercise.reps}
                        onChange={(e) => setCustomExercise({ ...customExercise, reps: e.target.value })}
                        placeholder="10"
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>
                        Weight
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={customExercise.weight}
                        onChange={(e) => setCustomExercise({ ...customExercise, weight: e.target.value })}
                        placeholder="60 kg"
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>
                        Muscle Groups
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={customExercise.targets.join(', ')}
                        onChange={(e) => setCustomExercise({ ...customExercise, targets: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                        placeholder="chest, shoulders"
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button onClick={addCustomExercise} className="btn-primary">
                      <Save size={16} />
                      Add Exercise
                    </button>
                    <button onClick={() => setShowCustomExercise(false)} className="btn-secondary">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}