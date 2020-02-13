using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace Task1Map
{
    public class MapController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}