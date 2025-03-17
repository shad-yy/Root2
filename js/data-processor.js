/**
 * SMART Live TV - Data Processor
 * 
 * Transforms raw API data into standardized formats for display
 * Ensures consistent data structures even when APIs change or are unavailable
 * 
 * This class handles the transformation layer between API responses and UI components,
 * creating a clean separation between data fetching and data presentation.
 */

// Import the configuration
import CONFIG from './config.js';

/**
 * Data Processor for sports data
 * Converts raw API data into structured format for display
 */
const DataProcessor = {
  // ========== FOOTBALL/SOCCER DATA PROCESSORS ==========

  /**
   * Process matches data from API
   * 
   * @param {Object} matchesData - Raw matches data from API
   * @returns {Array} - Processed matches
   */
  processMatches(matchesData) {
    if (!matchesData || !matchesData.events || !Array.isArray(matchesData.events)) {
      console.warn('Invalid matches data format:', matchesData);
      return [];
    }

    // Sort matches by start time (most recent first for past matches, soonest first for upcoming)
    const now = Date.now();
    const pastMatches = [];
    const upcomingMatches = [];

    matchesData.events.forEach(match => {
      const matchTime = (match.startTimestamp || Math.floor(Date.now() / 1000)) * 1000; // Convert to milliseconds

      const processedMatch = {
        id: match.id || `match-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        homeTeam: {
          id: match.homeTeam?.id || 0,
          name: match.homeTeam?.name || 'Unknown Team',
          logo: match.homeTeam?.logo || CONFIG.PLACEHOLDER_IMAGES.TEAM,
          color: match.homeTeam?.teamColors?.primary || "#374df5"
        },
        awayTeam: {
          id: match.awayTeam?.id || 0,
          name: match.awayTeam?.name || 'Unknown Team',
          logo: match.awayTeam?.logo || CONFIG.PLACEHOLDER_IMAGES.TEAM,
          color: match.awayTeam?.teamColors?.primary || "#374df5"
        },
        score: {
          home: match.homeScore?.current || 0,
          away: match.awayScore?.current || 0
        },
        status: {
          description: match.status?.description || "Unknown",
          isLive: match.status?.description === "In Progress" || match.status?.description === "Halftime",
          code: match.status?.code || 0
        },
        startTime: matchTime,
        tournament: match.tournament?.name || "Unknown League",
        slug: match.slug || `${(match.homeTeam?.name || 'team-1').toLowerCase()}-vs-${(match.awayTeam?.name || 'team-2').toLowerCase()}`.replace(/\s+/g, '-'),
        round: match.roundInfo?.round || 0
      };

      if (matchTime < now && !processedMatch.status.isLive) {
        pastMatches.push(processedMatch);
      } else {
        upcomingMatches.push(processedMatch);
      }
    });

    // Sort past matches by start time (most recent first)
    pastMatches.sort((a, b) => b.startTime - a.startTime);

    // Sort upcoming matches by start time (soonest first)
    upcomingMatches.sort((a, b) => a.startTime - b.startTime);

    // Combine with live and upcoming matches first
    return [...upcomingMatches, ...pastMatches];
  },

  /**
   * Process standings data from API
   * 
   * @param {Object} standingsData - Raw standings data from API
   * @returns {Array} - Processed standings
   */
  processStandings(standingsData) {
    if (!standingsData || !standingsData.standings || !Array.isArray(standingsData.standings)) {
      console.warn('Invalid standings data format:', standingsData);
      return [];
    }

    const firstStandings = standingsData.standings[0];
    if (!firstStandings || !firstStandings.rows || !Array.isArray(firstStandings.rows)) {
      console.warn('No standings rows available:', standingsData);
      return [];
    }

    return firstStandings.rows.map(row => {
      return {
        position: row.position || 0,
        team: {
          id: row.team?.id || 0,
          name: row.team?.name || 'Unknown Team',
          shortName: row.team?.shortName || row.team?.name || 'Unknown',
          logo: row.team?.logo || CONFIG.PLACEHOLDER_IMAGES.TEAM,
          colors: row.team?.teamColors || { primary: "#444444", secondary: "#FFFFFF" }
        },
        stats: {
          matches: row.matches || 0,
          wins: row.wins || 0,
          draws: row.draws || 0,
          losses: row.losses || 0,
          points: row.points || 0,
          goalsFor: row.scoresFor || 0,
          goalsAgainst: row.scoresAgainst || 0,
          goalDifference: row.scoreDifference || 0,
          goalDifferenceFormatted: row.scoreDifferenceFormatted || '0'
        },
        promotion: row.promotion ? {
          text: row.promotion.text || '',
          id: row.promotion.id || 0
        } : null
      };
    });
  },

  /**
   * Process team data from API
   * 
   * @param {Object} teamData - Raw team data from API
   * @returns {Object} - Processed team data
   */
  processTeamData(teamData) {
    if (!teamData || !teamData.team) {
      console.warn('Invalid team data format:', teamData);
      return null;
    }

    const team = teamData.team;

    return {
      id: team.id || 0,
      name: team.name || 'Unknown Team',
      shortName: team.shortName || team.name || 'Unknown',
      fullName: team.fullName || team.name || 'Unknown Team',
      slug: team.slug || team.name?.toLowerCase().replace(/\s+/g, '-') || 'unknown-team',
      nameCode: team.nameCode || '',
      logo: team.logo || CONFIG.PLACEHOLDER_IMAGES.TEAM,
      colors: {
        primary: team.teamColors?.primary || "#000000",
        secondary: team.teamColors?.secondary || "#ffffff",
        text: team.teamColors?.text || "#ffffff"
      },
      venue: team.venue ? {
        name: team.venue.name || 'Unknown Venue',
        city: team.venue.city?.name || 'Unknown City',
        capacity: team.venue.capacity || 0,
        coordinates: team.venue.venueCoordinates || null
      } : null,
      country: {
        name: team.country?.name || 'Unknown Country',
        flag: team.country?.slug || 'unknown'
      },
      manager: team.manager ? {
        id: team.manager.id || 0,
        name: team.manager.name || 'Unknown Manager',
        shortName: team.manager.shortName || team.manager.name || 'Unknown',
        country: team.manager.country?.name || 'Unknown Country'
      } : null,
      tournament: team.tournament ? {
        id: team.tournament.id || 0,
        name: team.tournament.name || 'Unknown Tournament',
        slug: team.tournament.slug || 'unknown-tournament'
      } : null,
      foundationDate: team.foundationDateTimestamp ? new Date(team.foundationDateTimestamp * 1000) : null,
      form: team.pregameForm ? {
        position: team.pregameForm.position || 0,
        rating: team.pregameForm.avgRating || 0,
        value: team.pregameForm.value || 0,
        recentResults: team.pregameForm.form || []
      } : null
    };
  },

  // ========== UFC/MMA DATA PROCESSORS ==========

  /**
   * Generate UFC fighter image path
   * 
   * @param {string} name - Fighter name
   * @returns {string} - Image path
   */
  getUFCFighterImagePath(name) {
    if (!name) return CONFIG.PLACEHOLDER_IMAGES.FIGHTER;
    return `/images/fighters/${name.toLowerCase().replace(/\s+/g, '-')}.png`;
  },

  /**
   * Generate UFC event image path
   * 
   * @param {string} eventName - Event name
   * @returns {string} - Image path
   */
  getUFCEventImagePath(eventName) {
    if (!eventName) return CONFIG.PLACEHOLDER_IMAGES.EVENT;

    // Extract event number for UFC numbered events (e.g., "UFC 307")
    const match = eventName.match(/UFC\s+(\d+)/i);
    if (match) {
      return `/images/events/ufc-${match[1]}.png`;
    }

    // For Fight Nights and other events
    return `/images/events/${eventName.toLowerCase().replace(/\s+/g, '-')}.png`;
  },

  /**
   * Process UFC rankings for a weight class
   * 
   * @param {Array} rankingsData - Raw rankings data from API
   * @returns {Object} - Processed UFC rankings
   */
  processUFCRankings(rankingsData) {
    if (!rankingsData || !Array.isArray(rankingsData) || rankingsData.length === 0) {
      console.warn('Invalid UFC rankings data format:', rankingsData);
      return [];
    }

    return rankingsData.map(weightClassData => {
      if (!weightClassData || !weightClassData.weight_class || !weightClassData.champion) {
        console.warn('Missing weight class or champion in UFC rankings:', weightClassData);
        return null;
      }

      // Extract contenders and convert to array format
      const contendersList = [];
      if (weightClassData.contenders) {
        for (let i = 1; i <= 15; i++) {
          const contender = weightClassData.contenders[i.toString()];
          if (contender) {
            contendersList.push({
              rank: i,
              name: contender,
              image: this.getUFCFighterImagePath(contender),
              record: '', // API doesn't provide record
              lastFight: '' // API doesn't provide last fight
            });
          }
        }
      }

      return {
        weightClass: weightClassData.weight_class,
        champion: {
          name: weightClassData.champion,
          image: this.getUFCFighterImagePath(weightClassData.champion),
          record: '', // API doesn't provide record
          lastFight: '' // API doesn't provide last fight
        },
        contenders: contendersList
      };
    }).filter(item => item !== null);
  },

  /**
   * Process fighter search results
   * 
   * @param {Array} fighterData - Raw fighter data from API
   * @returns {Array} - Processed fighter data
   */
  processFighterData(fighterData) {
    if (!fighterData || !Array.isArray(fighterData)) {
      console.warn('Invalid fighter data format:', fighterData);
      return [];
    }

    return fighterData.map(fighter => {
      const fullName = `${fighter.first_name || ''} ${fighter.last_name || ''}`.trim();

      return {
        name: fullName || 'Unknown Fighter',
        firstName: fighter.first_name || '',
        lastName: fighter.last_name || '',
        nickname: fighter.nickname || '',
        weightClass: fighter.weight_class || 'Unknown',
        height: fighter.height || '',
        weight: fighter.weight || '',
        reach: fighter.reach || '',
        stance: fighter.stance || '',
        record: {
          wins: parseInt(fighter.wins) || 0,
          losses: parseInt(fighter.losses) || 0,
          draws: parseInt(fighter.draws) || 0
        },
        isChampion: fighter.belt === "1"
      };
    });
  },

  /**
   * Process special markets data (for betting odds)
   * 
   * @param {Object} marketData - Raw market data from API
   * @returns {Array} - Processed markets
   */
  processSpecialMarkets(marketData) {
    if (!marketData || !marketData.specials || !Array.isArray(marketData.specials)) {
      console.warn('Invalid special markets data format:', marketData);
      return [];
    }

    // Only get upcoming UFC markets
    const now = new Date();

    return marketData.specials
      .filter(market => {
        // Check if it's a UFC market
        if (market.category !== "UFC General Props") {
          return false;
        }

        // Check if it has a valid event and fighters
        if (!market.event || !market.event.home || !market.event.away) {
          return false;
        }

        // Check if it's in the future
        const startDate = new Date(market.starts);
        return startDate > now;
      })
      .map(market => {
        // Organize the odds lines
        const odds = [];
        if (market.lines) {
          for (const key in market.lines) {
            const line = market.lines[key];
            odds.push({
              id: line.id || key,
              name: line.name || 'Unknown',
              price: line.price || 0
            });
          }
        }

        return {
          id: market.special_id || `market-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: market.name || 'Unknown Market',
          fighters: {
            home: market.event.home || 'Unknown Fighter',
            away: market.event.away || 'Unknown Fighter'
          },
          startTime: market.starts ? new Date(market.starts) : now,
          category: market.category || 'UFC',
          odds: odds
        };
      })
      .sort((a, b) => a.startTime - b.startTime); // Sort by date (earliest first)
  },

  /**
   * Process UFC tournaments (events)
   * 
   * @param {Object} tournamentData - Raw tournament data from API
   * @returns {Array} - Processed tournaments
   */
  processTournaments(tournamentData) {
    if (!tournamentData) {
      console.warn('Invalid tournament data format:', tournamentData);
      return [];
    }

    const tournaments = [];

    for (const key in tournamentData) {
      const event = tournamentData[key];

      if (event && event.categoryName === "UFC" && event.name) {
        // Extract event details from name
        let location = "";
        let mainEvent = "";

        // Try to parse main event from name (e.g., "UFC 314: Volkanovski vs. Lopes")
        const mainEventMatch = event.name.match(/:\s*(.+?)\s+vs\.\s+(.+?)$/i);
        if (mainEventMatch) {
          mainEvent = `${mainEventMatch[1]} vs ${mainEventMatch[2]}`;
        }

        tournaments.push({
          id: event.tournamentId || key,
          name: event.name || 'Unknown UFC Event',
          mainEvent: mainEvent,
          location: location,
          startDate: event.startDate || null,
          sportName: event.sportName || 'UFC'
        });
      }
    }

    return tournaments;
  },

  // ========== FORMULA 1 DATA PROCESSORS ==========

  /**
   * Process F1 races
   * 
   * @param {Object} racesData - Raw races data from API
   * @returns {Array} - Processed races
   */
  processF1Races(racesData) {
    if (!racesData || !racesData.races || !Array.isArray(racesData.races)) {
      console.warn('Invalid F1 races data format:', racesData);
      return [];
    }

    return racesData.races.map(race => {
      const raceDate = race.date ? new Date(race.date) : new Date();
      const now = new Date();
      const isCompleted = race.completed === true || raceDate < now;

      return {
        round: race.round || 0,
        name: race.name || 'Unknown Grand Prix',
        circuit: race.circuit || 'Unknown Circuit',
        date: raceDate.toISOString(),
        completed: isCompleted,
        winner: race.winner || null
      };
    }).sort((a, b) => {
      // Sort by date, but if some races don't have dates, sort by round
      if (a.date && b.date) {
        return new Date(a.date) - new Date(b.date);
      }
      return a.round - b.round;
    });
  },

  /**
   * Process F1 driver standings
   * 
   * @param {Object} standingsData - Raw driver standings data
   * @returns {Array} - Processed driver standings
   */
  processF1DriverStandings(standingsData) {
    if (!standingsData || !standingsData.drivers || !Array.isArray(standingsData.drivers)) {
      console.warn('Invalid F1 driver standings data format:', standingsData);
      return [];
    }

    return standingsData.drivers.map(driver => {
      return {
        position: driver.position || 0,
        name: driver.name || 'Unknown Driver',
        team: driver.team || 'Unknown Team',
        points: driver.points || 0,
        nationality: driver.nationality || 'Unknown'
      };
    }).sort((a, b) => a.position - b.position);
  },

  /**
   * Process F1 constructor standings
   * 
   * @param {Object} constructorsData - Raw constructor standings data
   * @returns {Array} - Processed constructor standings
   */
  processF1ConstructorStandings(constructorsData) {
    if (!constructorsData || !constructorsData.teams || !Array.isArray(constructorsData.teams)) {
      console.warn('Invalid F1 constructor standings data format:', constructorsData);
      return [];
    }

    return constructorsData.teams.map(team => {
      // Find the team in our config to get the color
      const teamConfig = CONFIG.F1.TEAMS.find(t =>
        t.name.toLowerCase() === team.name?.toLowerCase() ||
        (t.shortName && team.name?.toLowerCase().includes(t.shortName.toLowerCase()))
      );

      return {
        position: team.position || 0,
        name: team.name || 'Unknown Team',
        points: team.points || 0,
        color: teamConfig?.color || "#333333",
        drivers: team.drivers || 'Unknown Drivers'
      };
    }).sort((a, b) => a.position - b.position);
  },

  /**
   * Process F1 race results
   * 
   * @param {Object} resultsData - Raw race results data
   * @returns {Array} - Processed race results
   */
  processF1RaceResults(resultsData) {
    if (!resultsData || !resultsData.results || !Array.isArray(resultsData.results)) {
      console.warn('Invalid F1 race results data format:', resultsData);
      return [];
    }

    return resultsData.results.map(result => {
      return {
        position: result.position || 0,
        driver: result.driver || 'Unknown Driver',
        team: result.team || 'Unknown Team',
        time: result.time || 'DNF',
        points: result.points || 0,
        fastestLap: result.fastestLap || false
      };
    }).sort((a, b) => a.position - b.position);
  },

  /**
   * Process F1 calendar data
   * @param {Object} calendarData - Raw F1 calendar data from API
   * @returns {Array} - Processed F1 races
   */
  processF1Calendar(calendarData) {
    if (!calendarData || !calendarData.races || !Array.isArray(calendarData.races)) {
      console.warn('Invalid F1 calendar data format:', calendarData);
      return [];
    }
    
    // Process races
    return calendarData.races.map(race => {
      // Extract circuit data
      const circuit = race.circuit || {};
      
      // Create processed race object
      return {
        id: race.id || `race-${race.round}`,
        name: race.name || `Race ${race.round}`,
        round: race.round,
        date: race.date,
        time: race.time,
        circuit: {
          id: circuit.id,
          name: circuit.name || 'Unknown Circuit',
          location: circuit.location || 'Unknown Location',
          country: circuit.country || 'Unknown Country'
        },
        season: race.season,
        status: this.getRaceStatus(race.date, race.time),
        url: race.url
      };
    }).sort((a, b) => {
      // Sort by date (upcoming first, then past)
      const dateA = new Date(a.date + 'T' + (a.time || '00:00:00Z'));
      const dateB = new Date(b.date + 'T' + (b.time || '00:00:00Z'));
      
      // If both races are in the future or both in the past
      if ((dateA > new Date() && dateB > new Date()) || 
          (dateA <= new Date() && dateB <= new Date())) {
        return dateA - dateB;
      }
      
      // Upcoming races first
      return dateA > new Date() ? -1 : 1;
    });
  },

  /**
   * Get race status based on date and time
   * @param {string} date - Race date (YYYY-MM-DD)
   * @param {string} time - Race time (HH:MM:SSZ)
   * @returns {string} - Race status (upcoming, live, completed)
   */
  getRaceStatus(date, time) {
    if (!date) return 'unknown';
    
    const raceDateTime = new Date(date + 'T' + (time || '00:00:00Z'));
    const now = new Date();
    
    // Race is in the future
    if (raceDateTime > now) {
      return 'upcoming';
    }
    
    // Race is live (within 3 hours of start time)
    const threeHoursAfterStart = new Date(raceDateTime);
    threeHoursAfterStart.setHours(threeHoursAfterStart.getHours() + 3);
    
    if (now >= raceDateTime && now <= threeHoursAfterStart) {
      return 'live';
    }
    
    // Race is completed
    return 'completed';
  },

  // ========== BLOG GENERATION METHODS ==========

  /**
   * Generate a blog post from a news article
   * 
   * @param {Object} newsItem - News article from API
   * @param {string} keyword - Primary keyword for the post
   * @returns {Object} - Generated blog post
   */
  generateBlogPost(newsItem, keyword) {
    if (!newsItem || !newsItem.title) {
      console.warn('Invalid news item for blog generation:', newsItem);
      return null;
    }

    const title = newsItem.title || `Latest ${keyword} News`;
    const snippet = newsItem.description || newsItem.summary || '';
    const source = newsItem.source?.name || 'Sports News';
    const publishedAt = newsItem.publishedAt ? new Date(newsItem.publishedAt) : new Date();

    // Create a slug for the URL
    const slug = this.createSlug(title);

    // Format the date for display
    const formattedDate = this.formatDate(publishedAt);

    // Find related categories
    const categories = this.findRelatedCategories(keyword, title, snippet);

    // Generate blog content based on the news item
    const content = this.generateBlogContent(newsItem, keyword, categories);

    // Select an image
    const imageIndex = Math.floor(Math.random() * CONFIG.BLOG.DEFAULT_IMAGES.length);
    const imagePath = CONFIG.BLOG.DEFAULT_IMAGES[imageIndex];

    return {
      title,
      slug,
      content,
      keyword,
      categories,
      date: publishedAt.toISOString(),
      formattedDate,
      summary: this.truncateSummary(snippet),
      source,
      image: imagePath.replace(/^\//, ''), // Remove leading slash if present
      author: 'SMART Live TV',
      type: 'automated',
      isAutomated: true
    };
  },

  /**
   * Generate blog content
   * 
   * @param {Object} newsItem - News article
   * @param {string} keyword - Primary keyword
   * @param {Array} categories - Related categories
   * @returns {string} - Generated blog content in Markdown format
   */
  generateBlogContent(newsItem, keyword, categories) {
    const title = newsItem.title || `Latest ${keyword} News`;
    const snippet = newsItem.description || newsItem.summary || '';
    const content = newsItem.content || '';

    // Add some variety to the content structure with different templates
    const templateIndex = Math.floor(Math.random() * 3);

    switch (templateIndex) {
      case 0:
        return this.generateBlogTemplate1(title, snippet, content, keyword, categories);
      case 1:
        return this.generateBlogTemplate2(title, snippet, content, keyword, categories);
      case 2:
        return this.generateBlogTemplate3(title, snippet, content, keyword, categories);
      default:
        return this.generateBlogTemplate1(title, snippet, content, keyword, categories);
    }
  },

  /**
   * Generate blog content using template 1
   */
  generateBlogTemplate1(title, snippet, content, keyword, categories) {
    const categoriesToLink = categories.slice(0, 3).map(cat =>
      `[${cat}](/tag/${this.createSlug(cat)})`
    ).join(', ');

    return `
# ${title}

*${this.formatDate(new Date())} | Tags: ${categoriesToLink}*

${snippet}

## Latest Developments

The sporting world is buzzing with the latest developments around ${keyword}. Fans and analysts alike are keeping a close eye on this trending topic.

${this.expandContent(content, keyword)}

## What This Means for Fans

${this.generateFanImpactSection(keyword, categories)}

## Expert Analysis

Our sports analysts provide in-depth coverage of all the major developments related to ${keyword}. Stay tuned for more updates on this trending topic.

${this.generateCallToAction(keyword, categories)}

## Related Stories

${this.generateRelatedLinks(keyword, categories)}

*This article was automatically generated based on trending sports topics and the latest news. Content is updated regularly to provide the most current information.*
    `;
  },

  /**
   * Generate blog content using template 2
   */
  generateBlogTemplate2(title, snippet, content, keyword, categories) {
    const categoriesToLink = categories.slice(0, 3).map(cat =>
      `[${cat}](/tag/${this.createSlug(cat)})`
    ).join(', ');

    return `
# ${title}

*Published on ${this.formatDate(new Date())} | Categories: ${categoriesToLink}*

> "${snippet}"

## Breaking News Update

${this.expandContent(content, keyword)}

## Key Takeaways

${this.generateKeyTakeaways(keyword, categories)}

## What's Next

${this.generateWhatsNextSection(keyword, categories)}

${this.generateCallToAction(keyword, categories)}

## More on ${keyword}

${this.generateRelatedLinks(keyword, categories)}

*Our automated sports news system continuously monitors trending topics to bring you the latest updates. Last updated: ${new Date().toLocaleTimeString()}*
    `;
  },

  /**
   * Generate blog content using template 3
   */
  generateBlogTemplate3(title, snippet, content, keyword, categories) {
    const category = categories.length > 0 ? categories[0] : 'Sports';

    return `
# ${title}

*${this.formatDate(new Date())} | ${category} News*

${snippet}

---

## The Story So Far

${this.expandContent(content, keyword)}

## Why It Matters

${this.generateWhyItMattersSection(keyword, categories)}

## Timeline of Events

${this.generateTimelineSection(keyword)}

${this.generateCallToAction(keyword, categories)}

## For More ${category} News

${this.generateRelatedLinks(keyword, categories)}

*This content is part of our automated sports news service that brings you the latest updates on trending topics.*
    `;
  },

  /**
   * Expand the content with more details
   */
  expandContent(originalContent, keyword) {
    // Clean up the original content
    const cleanContent = (originalContent || '')
      .replace(/\[\+\d+ chars\]$/, '')  // Remove "[+123 chars]" from truncated content
      .replace(/\s{2,}/g, ' ')          // Replace multiple spaces with a single one
      .trim();

    // If we have sufficient content, return it
    if (cleanContent.length > 150) {
      return cleanContent;
    }

    // Otherwise, generate content based on the keyword
    return `
The latest developments regarding ${keyword} have captured the attention of the sports community. 
According to recent reports, there have been significant updates that could impact upcoming events and rankings.
Experts are closely monitoring these developments, as they may have long-term implications for the sport.
Athletes and teams involved with ${keyword} are preparing for potential changes, with many adjusting their strategies accordingly.
    `;
  },

  /**
   * Generate a section about impact on fans
   */
  generateFanImpactSection(keyword, categories) {
    const category = categories.length > 0 ? categories[0] : 'sports';

    const fanImpacts = [
      `For ${category} fans, these developments could significantly change the way they experience upcoming events. Viewers should stay tuned for more updates as the situation evolves.`,
      `Fans of ${category} are expressing mixed reactions to these developments. Social media has been buzzing with discussions about what these changes might mean for the future of the sport.`,
      `The community around ${keyword} has been quick to react to this news. Fan forums and social media groups are analyzing every detail and speculating about potential outcomes.`,
      `This news has direct implications for fans who have been following ${keyword}. Many are now reconsidering their expectations for upcoming events and matches.`,
      `The passionate fanbase has shown tremendous interest in these developments. Ticket sales and streaming subscriptions related to ${keyword} events have seen significant movement as a result.`
    ];

    // Randomly select one of the fan impact statements
    const randomIndex = Math.floor(Math.random() * fanImpacts.length);
    return fanImpacts[randomIndex];
  },

  /**
   * Generate key takeaways from the news
   */
  generateKeyTakeaways(keyword, categories) {
    const takeaways = [
      `- The developments around ${keyword} are evolving rapidly`,
      `- Industry experts are closely monitoring the situation`,
      `- This could impact upcoming ${categories[0] || 'sports'} events`,
      `- Fan reactions have been mixed across social media platforms`,
      `- Teams and athletes are adapting their strategies accordingly`,
      `- This news comes at a crucial point in the ${categories[0] || 'sports'} calendar`,
      `- Analysts predict this will have long-term implications for ${keyword}`,
      `- Several key stakeholders have already issued statements`
    ];

    // Randomly select 3-4 takeaways
    const numTakeaways = Math.floor(Math.random() * 2) + 3; // 3 or 4
    const selectedTakeaways = [];

    while (selectedTakeaways.length < numTakeaways && takeaways.length > 0) {
      const randomIndex = Math.floor(Math.random() * takeaways.length);
      selectedTakeaways.push(takeaways[randomIndex]);
      takeaways.splice(randomIndex, 1);
    }

    return selectedTakeaways.join('\n');
  },

  /**
   * Generate a "what's next" section
   */
  generateWhatsNextSection(keyword, categories) {
    const category = categories.length > 0 ? categories[0] : 'sports';

    const whatsNextOptions = [
      `As this story develops, all eyes will be on the key stakeholders involved with ${keyword}. Upcoming announcements could further clarify the situation and provide more context for fans and analysts.`,
      `The next few days will be critical for the evolution of this ${category} story. Sources close to the situation suggest that additional information may be forthcoming, potentially changing the current narrative.`,
      `Industry insiders expect further developments in this story within the coming week. The ${category} community is poised to respond to any new information that emerges.`,
      `Watch for official statements from the ${category} governing bodies regarding ${keyword}. These organizations typically provide guidance and context that can help interpret the implications of these developments.`
    ];

    const randomIndex = Math.floor(Math.random() * whatsNextOptions.length);
    return whatsNextOptions[randomIndex];
  },

  /**
   * Generate a "why it matters" section
   */
  generateWhyItMattersSection(keyword, categories) {
    const category = categories.length > 0 ? categories[0] : 'sports';

    const whyItMattersOptions = [
      `The significance of these developments extends beyond just ${keyword} itself. This could reshape aspects of ${category} as we know it, influencing everything from player strategies to fan engagement.`,
      `In the competitive world of ${category}, every development around ${keyword} can have cascading effects. Teams and athletes carefully analyze these changes to maintain their competitive edge.`,
      `For the ${category} industry, trends related to ${keyword} often serve as indicators of broader shifts. Stakeholders from sponsors to broadcasters are paying close attention to how this situation unfolds.`,
      `${keyword} has become a central topic in ${category} discussions because of its potential to influence upcoming events, rankings, and even rulebook considerations.`
    ];

    const randomIndex = Math.floor(Math.random() * whyItMattersOptions.length);
    return whyItMattersOptions[randomIndex];
  },

  /**
   * Generate a timeline section
   */
  generateTimelineSection(keyword) {
    const now = new Date();

    // Create a set of dates leading up to now
    const today = new Date(now);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);

    return `
- **${this.formatDate(lastWeek)}**: Initial reports emerge about ${keyword}
- **${this.formatDate(twoDaysAgo)}**: Industry experts begin analyzing the potential impact
- **${this.formatDate(yesterday)}**: First official statements released regarding the situation
- **${this.formatDate(today)}**: Latest developments and reactions from the community
    `
  }
}
